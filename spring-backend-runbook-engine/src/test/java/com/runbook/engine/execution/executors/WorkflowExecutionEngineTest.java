package com.runbook.engine.execution.executors;

import com.runbook.engine.domain.ExecutionTriggerType;
import com.runbook.engine.domain.Workflow;
import com.runbook.engine.execution.ExecutionEventPublisher;
import com.runbook.engine.execution.ExecutionLog;
import com.runbook.engine.execution.NodeExecution;
import com.runbook.engine.execution.WorkflowExecution;
import com.runbook.engine.execution.kafka.NodeExecutionProducer;
import com.runbook.engine.execution.kafka.NodeExecutionTask;
import com.runbook.engine.repository.ExecutionLogRepository;
import com.runbook.engine.repository.NodeExecutionRepository;
import com.runbook.engine.repository.WorkflowExecutionRepository;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class WorkflowExecutionEngineTest {

    @Test
    void fansOutParallelChildrenAfterRootCompletes() {
        List<NodeExecutionTask> publishedTasks = new CopyOnWriteArrayList<>();
        WorkflowExecutionEngine engine = buildEngine(
                List.of(new PassThroughExecutor("DATA_TRIGGER")),
                publishedTasks,
                new AtomicInteger()
        );

        Workflow workflow = Workflow.builder()
                .id(UUID.randomUUID())
                .definition("""
                        {
                          "nodes": [
                            {"id": "trigger", "data": {"type": "DATA_TRIGGER", "config": {}}},
                            {"id": "left", "data": {"type": "DATA_TRIGGER", "config": {}}},
                            {"id": "right", "data": {"type": "DATA_TRIGGER", "config": {}}}
                          ],
                          "edges": [
                            {"source": "trigger", "target": "left", "sourceHandle": null},
                            {"source": "trigger", "target": "right", "sourceHandle": null}
                          ]
                        }
                        """)
                .build();

        UUID executionId = UUID.randomUUID();
        engine.execute(workflow, executionId, false, ExecutionTriggerType.MANUAL, Map.of(), null);
        engine.processNodeTask(publishedTasks.get(0));

        assertEquals(3, publishedTasks.size());
        assertTrue(publishedTasks.stream().anyMatch(task -> "left".equals(task.getNodeId())));
        assertTrue(publishedTasks.stream().anyMatch(task -> "right".equals(task.getNodeId())));
    }

    @Test
    void retriesNodeAccordingToConfiguration() {
        List<NodeExecutionTask> publishedTasks = new CopyOnWriteArrayList<>();
        AtomicInteger attempts = new AtomicInteger();
        WorkflowExecutionEngine engine = buildEngine(
                List.of(new PassThroughExecutor("DATA_TRIGGER"), new FlakyExecutor(attempts)),
                publishedTasks,
                attempts
        );

        Workflow workflow = Workflow.builder()
                .id(UUID.randomUUID())
                .definition("""
                        {
                          "nodes": [
                            {"id": "trigger", "data": {"type": "DATA_TRIGGER", "config": {}}},
                            {"id": "flaky", "data": {"type": "DATA_FETCH", "config": {"retryCount": 2, "retryDelay": 0}}}
                          ],
                          "edges": [
                            {"source": "trigger", "target": "flaky", "sourceHandle": null}
                          ]
                        }
                        """)
                .build();

        engine.execute(workflow, UUID.randomUUID(), false, ExecutionTriggerType.MANUAL, Map.of(), null);
        engine.processNodeTask(publishedTasks.get(0));
        engine.processNodeTask(publishedTasks.get(1));

        assertEquals(3, attempts.get());
    }

    private WorkflowExecutionEngine buildEngine(
            List<NodeExecutor> executors,
            List<NodeExecutionTask> publishedTasks,
            AtomicInteger attempts
    ) {
        WorkflowExecutionRepository executionRepository = mock(WorkflowExecutionRepository.class);
        NodeExecutionRepository nodeExecutionRepository = mock(NodeExecutionRepository.class);
        ExecutionLogRepository executionLogRepository = mock(ExecutionLogRepository.class);
        ExecutionEventPublisher eventPublisher = mock(ExecutionEventPublisher.class);
        NodeExecutionProducer producer = mock(NodeExecutionProducer.class);
        tools.jackson.databind.ObjectMapper objectMapper = new tools.jackson.databind.ObjectMapper();

        when(executionRepository.save(any(WorkflowExecution.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(nodeExecutionRepository.save(any(NodeExecution.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(executionLogRepository.save(any(ExecutionLog.class))).thenAnswer(invocation -> invocation.getArgument(0));
        doAnswer(invocation -> {
            publishedTasks.add(invocation.getArgument(1));
            return null;
        }).when(producer).publish(anyString(), any(NodeExecutionTask.class));

        return new WorkflowExecutionEngine(
                executors,
                executionRepository,
                nodeExecutionRepository,
                executionLogRepository,
                eventPublisher,
                objectMapper,
                producer,
                new SimpleMeterRegistry()
        );
    }

    private record PassThroughExecutor(String type) implements NodeExecutor {
        @Override
        public String getType() {
            return type;
        }

        @Override
        public com.runbook.engine.execution.NodeExecutionResult execute(
                com.runbook.engine.execution.graph.WorkflowNode node,
                com.runbook.engine.execution.ExecutionContext context
        ) {
            context.storeNodeOutput(node.getId(), Map.of("status", "ok"));
            return com.runbook.engine.execution.NodeExecutionResult.success();
        }
    }

    private static final class FlakyExecutor implements NodeExecutor {
        private final AtomicInteger attempts;

        private FlakyExecutor(AtomicInteger attempts) {
            this.attempts = attempts;
        }

        @Override
        public String getType() {
            return "DATA_FETCH";
        }

        @Override
        public com.runbook.engine.execution.NodeExecutionResult execute(
                com.runbook.engine.execution.graph.WorkflowNode node,
                com.runbook.engine.execution.ExecutionContext context
        ) {
            if (attempts.incrementAndGet() < 3) {
                throw new IllegalStateException("boom");
            }
            context.storeNodeOutput(node.getId(), Map.of("attempts", attempts.get()));
            return com.runbook.engine.execution.NodeExecutionResult.success();
        }
    }
}
