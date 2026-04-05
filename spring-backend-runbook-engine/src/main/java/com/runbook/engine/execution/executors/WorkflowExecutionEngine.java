package com.runbook.engine.execution.executors;

import com.runbook.engine.controller.dto.ExecutionEvent;
import com.runbook.engine.domain.ExecutionStatus;
import com.runbook.engine.domain.ExecutionTriggerType;
import com.runbook.engine.domain.Workflow;
import com.runbook.engine.execution.*;
import com.runbook.engine.execution.datapacket.DataPacket;
import com.runbook.engine.execution.graph.WorkflowGraph;
import com.runbook.engine.execution.graph.WorkflowNode;
import com.runbook.engine.execution.kafka.NodeExecutionProducer;
import com.runbook.engine.execution.kafka.NodeExecutionTask;
import com.runbook.engine.repository.ExecutionLogRepository;
import com.runbook.engine.repository.NodeExecutionRepository;
import com.runbook.engine.repository.WorkflowExecutionRepository;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
@Slf4j
public class WorkflowExecutionEngine {

    private final List<NodeExecutor> executors;
    private final WorkflowExecutionRepository executionRepo;
    private final NodeExecutionRepository nodeExecutionRepository;
    private final ExecutionLogRepository executionLogRepository;
    private final ExecutionEventPublisher eventPublisher;
    private final ObjectMapper objectMapper;
    private final NodeExecutionProducer nodeExecutionProducer;
    private final MeterRegistry meterRegistry;

    private final ConcurrentMap<UUID, RuntimeState> runtimeStates = new ConcurrentHashMap<>();
    private final ExecutorService timeoutExecutor = Executors.newCachedThreadPool();

    public void execute(Workflow workflow, UUID executionId, boolean isQuick) {
        execute(workflow, executionId, isQuick, isQuick ? ExecutionTriggerType.QUICK_RUN : ExecutionTriggerType.MANUAL, Map.of(), null);
    }

    public void execute(
            Workflow workflow,
            UUID executionId,
            boolean isQuick,
            ExecutionTriggerType triggerType,
            Map<String, Object> triggerPayload,
            UUID versionId
    ) {
        Objects.requireNonNull(workflow, "workflow must not be null");
        Objects.requireNonNull(executionId, "executionId must not be null");
        Objects.requireNonNull(triggerType, "triggerType must not be null");

        WorkflowExecution execution = WorkflowExecution.builder()
                .id(executionId)
                .workflowId(workflow.getId())
                .versionId(versionId)
                .status(ExecutionStatus.RUNNING)
                .triggerType(triggerType)
                .startedAt(Instant.now())
                .createdAt(Instant.now())
                .build();
        executionRepo.save(execution);
        meterRegistry.counter("workflow_execution_total").increment();

        try {
            WorkflowGraph graph = WorkflowParser.parse(workflow.getDefinition());
            RuntimeState state = new RuntimeState(graph, isQuick, execution);
            runtimeStates.put(executionId, state);

            ExecutionContext initialContext = buildInitialContext(executionId, triggerPayload);
            state.lastContextJson = initialContext.toJson();

            List<String> startNodes = graph.findTriggerNodes();
            if (startNodes.isEmpty()) {
                startNodes = graph.findRootNodes();
            }
            if (startNodes.isEmpty()) {
                throw new IllegalStateException("Workflow has no start nodes");
            }

            log.debug("START NODES: =>>>>>>>>>>>>>>>>>>>>>>>>>>" + startNodes.toString());

            for (String startNode : startNodes) {
                enqueueNodeTask(executionId, state, startNode, new ExecutionContext(initialContext));
            }
        } catch (Exception exception) {
            log.error("Workflow kickoff failed. executionId={}", executionId, exception);
            markExecutionFailed(executionId, exception);
            finalizeExecution(executionId);
            throw new IllegalStateException("Workflow kickoff failed", exception);
        }
    }

    public void processNodeTask(NodeExecutionTask task) {
        if (task == null || task.getExecutionId() == null || task.getNodeId() == null || task.getContextId() == null) {
            log.warn("Dropping invalid node task payload: {}", task);
            return;
        }

        UUID executionId = task.getExecutionId();
        RuntimeState state = runtimeStates.get(executionId);
        if (state == null) {
            log.warn("No runtime state found for executionId={}. Task ignored.", executionId);
            return;
        }

        try {
            if (state.failed.get()) {
                return;
            }

            ExecutionContext context = state.contextById.remove(task.getContextId());
            if (context == null) {
                throw new IllegalStateException("Execution context not found for contextId=" + task.getContextId());
            }
            context.setLogSink((level, nodeId, message) -> persistLog(executionId, nodeId, level, message));
            state.lastContextJson = context.toJson();

            executeNode(task.getNodeId(), state, context, executionId);
        } catch (Exception exception) {
            log.error("Node execution failed. executionId={}, nodeId={}", executionId, task.getNodeId(), exception);
            markExecutionFailed(executionId, exception);
        } finally {
            markNodeTaskFinished(executionId);
        }
    }

    private ExecutionContext buildInitialContext(UUID executionId, Map<String, Object> triggerPayload) {
        ExecutionContext context = new ExecutionContext();
        context.setLogSink((level, nodeId, message) -> persistLog(executionId, nodeId, level, message));
        Map<String, Object> safePayload = triggerPayload == null ? Map.of() : new LinkedHashMap<>(triggerPayload);
        context.putVariable("trigger", safePayload);
        context.putVariable("context", safePayload);
        safePayload.forEach(context::putVariable);
        return context;
    }

    private void executeNode(String nodeId, RuntimeState state, ExecutionContext context, UUID executionId) throws InterruptedException {
        WorkflowNode node = state.graph.getNode(nodeId);
        if (node == null) {
            throw new IllegalStateException("Node not found in graph: " + nodeId);
        }

        if (state.quick) {
            eventPublisher.publish(executionId, new ExecutionEvent("NODE_STARTED", nodeId, "Running"));
            try {
                Thread.sleep(3000);
            } catch (InterruptedException ignored) {
            }

        }

        NodeExecution nodeExecution = NodeExecution.builder()
                .id(UUID.randomUUID())
                .executionId(executionId)
                .nodeId(nodeId)
                .status(ExecutionStatus.RUNNING)
                .startedAt(Instant.now())
                .inputJson(serialize(context.snapshot()))
                .build();
        nodeExecutionRepository.save(nodeExecution);
        context.setActiveNodeId(nodeId);
        context.log("INFO", "Node started");

        Timer.Sample sample = Timer.start(meterRegistry);
        try {
            NodeExecutionResult result = executeWithRetry(node, context);
            context.markCompleted(nodeId);
            context.log("INFO", "Node completed");

            nodeExecution.setStatus(ExecutionStatus.SUCCESS);
            nodeExecution.setFinishedAt(Instant.now());
            nodeExecution.setOutputJson(serialize(resolveNodeOutput(context, nodeId)));
            nodeExecutionRepository.save(nodeExecution);

            sample.stop(meterRegistry.timer("node_execution_duration", "nodeId", nodeId, "status", "success"));
            if (state.quick) {
                eventPublisher.publish(executionId, new ExecutionEvent("NODE_COMPLETED", nodeId, "Completed"));
            }

            routeSuccess(node, result, state, context, executionId);
        } catch (Exception exception) {
            context.recordError(nodeId, exception.getMessage());
            context.log("ERROR", "Node failed: " + exception.getMessage());

            nodeExecution.setStatus(ExecutionStatus.FAILED);
            nodeExecution.setFinishedAt(Instant.now());
            nodeExecution.setErrorMessage(exception.getMessage());
            nodeExecution.setOutputJson(serialize(resolveNodeOutput(context, nodeId)));
            nodeExecutionRepository.save(nodeExecution);

            sample.stop(meterRegistry.timer("node_execution_duration", "nodeId", nodeId, "status", "failed"));
            List<String> failureNodes = state.graph.getNextNodes(nodeId, "failure");
            if (!failureNodes.isEmpty()) {
                ExecutionContext failureContext = new ExecutionContext(context);
                failureContext.putVariable("error", Map.of("nodeId", nodeId, "message", exception.getMessage()));
                for (String failureNodeId : failureNodes) {
                    registerChildContext(executionId, state, failureNodeId, failureContext);
                }
                if (state.quick) {
                    eventPublisher.publish(executionId, new ExecutionEvent("NODE_COMPLETED", nodeId, "Failed over"));
                }
                return;
            }

            throw new IllegalStateException(exception.getMessage(), exception);
        } finally {
            context.clearActiveNodeId();
            state.lastContextJson = context.toJson();
        }
    }

    private NodeExecutionResult executeWithRetry(WorkflowNode node, ExecutionContext context) throws Exception {
        int retryCount = readInt(node.getConfigOrEmpty(), "retryCount", 0);
        int retryDelaySeconds = readInt(node.getConfigOrEmpty(), "retryDelay", 0);
        int timeoutSeconds = readInt(node.getConfigOrEmpty(), "timeoutSeconds", 0);
        int totalAttempts = Math.max(1, retryCount + 1);
        Throwable lastFailure = null;

        for (int attempt = 1; attempt <= totalAttempts; attempt++) {
            try {
                context.log("INFO", "Attempt " + attempt + " of " + totalAttempts);
                return runExecutor(node, context, timeoutSeconds);
            } catch (Exception exception) {
                lastFailure = unwrap(exception);
                if (attempt >= totalAttempts) {
                    break;
                }
                context.log("WARN", "Attempt " + attempt + " failed: " + lastFailure.getMessage());
                if (retryDelaySeconds > 0) {
                    Thread.sleep(Duration.ofSeconds(retryDelaySeconds));
                }
            }
        }

        if (lastFailure instanceof Exception executionException) {
            throw executionException;
        }
        throw new IllegalStateException(lastFailure == null ? "Node execution failed" : lastFailure.getMessage(), lastFailure);
    }

    private NodeExecutionResult runExecutor(WorkflowNode node, ExecutionContext context, int timeoutSeconds) throws Exception {
        NodeExecutor executor = findExecutor(node.getType());
        Map<String, Object> resolvedConfig = resolveConfig(context, node.getConfigOrEmpty());
        WorkflowNode resolvedNode = node.withConfig(resolvedConfig);

        CompletableFuture<NodeExecutionResult> future = CompletableFuture.supplyAsync(
                () -> executor.execute(resolvedNode, context),
                timeoutExecutor
        );
        if (timeoutSeconds > 0) {
            future = future.orTimeout(timeoutSeconds, TimeUnit.SECONDS);
        }

        try {
            return future.join();
        } catch (CompletionException exception) {
            Throwable cause = unwrap(exception);
            if (cause instanceof Exception innerException) {
                throw innerException;
            }
            throw new IllegalStateException(cause);
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> resolveConfig(ExecutionContext context, Map<String, Object> config) {
        Object resolved = context.resolveExpressions(config);
        return resolved instanceof Map<?, ?> map ? (Map<String, Object>) map : Map.of();
    }

    private void routeSuccess(
            WorkflowNode node,
            NodeExecutionResult result,
            RuntimeState state,
            ExecutionContext context,
            UUID executionId
    ) throws InterruptedException {
        if ("CONDITION".equals(node.getType())) {
            routeConditionNode(node.getId(), state, context, executionId);
            return;
        }

        if ("LOOP".equals(node.getType())) {
            routeLoopNode(node, state, context, executionId);
            return;
        }

        String branch = result != null && result.getBranch() != null ? result.getBranch() : "success";
        List<String> nextNodes = state.graph.getNextNodes(node.getId(), branch);
        for (String nextNodeId : nextNodes) {
            registerChildContext(executionId, state, nextNodeId, context);
        }
    }

    private void routeConditionNode(String nodeId, RuntimeState state, ExecutionContext context, UUID executionId) throws InterruptedException {
        List<DataPacket> truePackets = context.get(nodeId + ":true");
        List<DataPacket> falsePackets = context.get(nodeId + ":false");

        for (String trueNode : state.graph.getNextNodes(nodeId, "true")) {
            ExecutionContext trueContext = new ExecutionContext(context);
            trueContext.store(truePackets);
            registerChildContext(executionId, state, trueNode, trueContext);
        }

        for (String falseNode : state.graph.getNextNodes(nodeId, "false")) {
            ExecutionContext falseContext = new ExecutionContext(context);
            falseContext.store(falsePackets);
            registerChildContext(executionId, state, falseNode, falseContext);
        }
    }

    private void routeLoopNode(WorkflowNode node, RuntimeState state, ExecutionContext context, UUID executionId) throws InterruptedException {
        Object sourceNode = node.getConfigOrEmpty().get("sourceNode");
        List<DataPacket> packets = sourceNode == null ? context.get() : context.getNodePackets(String.valueOf(sourceNode));
        if (packets == null || packets.isEmpty()) {
            return;
        }

        List<String> nextNodes = state.graph.getNextNodes(node.getId(), "success");
        for (DataPacket packet : packets) {
            ExecutionContext iterationContext = new ExecutionContext(context);
            iterationContext.store(List.of(packet));
            iterationContext.putVariable("loop", Map.of("item", packet.toMap()));
            for (String nextNodeId : nextNodes) {
                registerChildContext(executionId, state, nextNodeId, iterationContext);
            }
        }
    }

    private void registerChildContext(UUID executionId, RuntimeState state, String childNodeId, ExecutionContext context) throws InterruptedException {
        int requiredParents = state.graph.getIncomingCount(childNodeId);
        if (requiredParents <= 1) {
            enqueueNodeTask(executionId, state, childNodeId, new ExecutionContext(context));
            return;
        }

        synchronized (state.monitor) {
            List<ExecutionContext> waiting = state.pendingContexts.computeIfAbsent(childNodeId, ignored -> new ArrayList<>());
            waiting.add(new ExecutionContext(context));
            if (waiting.size() < requiredParents) {
                return;
            }

            ExecutionContext merged = waiting.get(0);
            for (int index = 1; index < waiting.size(); index++) {
                merged = merged.merge(waiting.get(index));
            }
            state.pendingContexts.remove(childNodeId);
            enqueueNodeTask(executionId, state, childNodeId, merged);
        }
    }

    private void enqueueNodeTask(UUID executionId, RuntimeState state, String nodeId, ExecutionContext context) throws InterruptedException {
        WorkflowNode node = state.graph.getNode(nodeId);
        if (node == null) {
            throw new IllegalStateException("Node not found in graph: " + nodeId);
        }

        UUID contextId = UUID.randomUUID();
        context.setLogSink((level, activeNodeId, message) -> persistLog(executionId, activeNodeId, level, message));
        state.contextById.put(contextId, context);
        state.inFlightTasks.incrementAndGet();

        try {
            nodeExecutionProducer.publish(node.getType(), new NodeExecutionTask(executionId, nodeId, contextId, state.quick));
        } catch (Exception exception) {
            state.contextById.remove(contextId);
            state.inFlightTasks.decrementAndGet();
            throw exception;
        }
    }

    private void persistLog(UUID executionId, String nodeId, String level, String message) {
        executionLogRepository.save(
                ExecutionLog.builder()
                        .id(UUID.randomUUID())
                        .executionId(executionId)
                        .nodeId(nodeId)
                        .timestamp(Instant.now())
                        .level(level)
                        .message(message)
                        .build()
        );
    }

    private void markExecutionFailed(UUID executionId, Exception exception) {
        RuntimeState state = runtimeStates.get(executionId);
        if (state == null) {
            return;
        }

        if (state.failed.compareAndSet(false, true)) {
            state.failureReason = exception.getMessage();
            state.execution.setErrorMessage(exception.getMessage());
            meterRegistry.counter("workflow_failure_total").increment();
            if (state.quick) {
                eventPublisher.publish(executionId, new ExecutionEvent("WORKFLOW_FAILED", null, exception.getMessage()));
            }
        }
    }

    private void markNodeTaskFinished(UUID executionId) {
        RuntimeState state = runtimeStates.get(executionId);
        if (state == null) {
            return;
        }

        int remaining = state.inFlightTasks.decrementAndGet();
        if (remaining == 0) {
            finalizeExecution(executionId);
        }
    }

    private void finalizeExecution(UUID executionId) {
        RuntimeState state = runtimeStates.get(executionId);
        if (state == null || !state.finished.compareAndSet(false, true)) {
            return;
        }

        log.debug("+========================================================================");
//        log.debug(state.toString());
        // Delay quick runs so UI can visualize execution

        WorkflowExecution execution = state.execution;
        execution.setStatus(state.failed.get() ? ExecutionStatus.FAILED : ExecutionStatus.SUCCESS);
        execution.setFinishedAt(Instant.now());
        execution.setContextJson(state.lastContextJson);
        executionRepo.save(execution);

        try {
            if (!state.failed.get() && state.quick) {
                eventPublisher.publish(executionId, new ExecutionEvent("WORKFLOW_COMPLETED", null, "Done"));
            }
            if (state.quick) {
                eventPublisher.complete(executionId);
            }

        } catch (Exception e) {

        }

        runtimeStates.remove(executionId);
    }

    private Object resolveNodeOutput(ExecutionContext context, String nodeId) {
        Object output = context.getNodeOutput(nodeId);
        return output == null ? context.snapshot() : output;
    }

    private NodeExecutor findExecutor(String nodeType) {
        return executors.stream()
                .filter(executor -> nodeType.equals(executor.getType()))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("No NodeExecutor registered for type: " + nodeType));
    }

    private int readInt(Map<String, Object> config, String key, int defaultValue) {
        Object value = config.get(key);
        if (value == null) {
            return defaultValue;
        }
        if (value instanceof Number number) {
            return number.intValue();
        }
        return Integer.parseInt(String.valueOf(value));
    }

    private Throwable unwrap(Throwable throwable) {
        if (throwable instanceof CompletionException || throwable instanceof ExecutionException) {
            return throwable.getCause() == null ? throwable : throwable.getCause();
        }
        return throwable;
    }

    private String serialize(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception exception) {
            return "{}";
        }
    }

    private static final class RuntimeState {

        private final WorkflowGraph graph;
        private final boolean quick;
        private final WorkflowExecution execution;
        private final AtomicInteger inFlightTasks = new AtomicInteger(0);
        private final AtomicBoolean failed = new AtomicBoolean(false);
        private final AtomicBoolean finished = new AtomicBoolean(false);
        private final ConcurrentMap<UUID, ExecutionContext> contextById = new ConcurrentHashMap<>();
        private final Map<String, List<ExecutionContext>> pendingContexts = new HashMap<>();
        private final Object monitor = new Object();
        private volatile String failureReason;
        private volatile String lastContextJson = "{}";

        private RuntimeState(WorkflowGraph graph, boolean quick, WorkflowExecution execution) {
            this.graph = graph;
            this.quick = quick;
            this.execution = execution;
        }
    }
}
