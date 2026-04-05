package com.runbook.engine.service;

import com.runbook.engine.domain.ExecutionTriggerType;
import com.runbook.engine.domain.Workflow;
import com.runbook.engine.domain.WorkflowVersion;
import com.runbook.engine.execution.executors.WorkflowExecutionEngine;
import com.runbook.engine.repository.WorkflowRepository;
import com.runbook.engine.repository.WorkflowVersionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class WorkflowRunnerService {

    private final WorkflowRepository workflowRepository;
    private final WorkflowVersionRepository workflowVersionRepository;
    private final WorkflowExecutionEngine engine;

    public void run(UUID workflowId, UUID id, boolean isQuick) {
        run(workflowId, id, isQuick, isQuick ? ExecutionTriggerType.QUICK_RUN : ExecutionTriggerType.MANUAL, Map.of());
    }

    public void run(
            UUID workflowId,
            UUID id,
            boolean isQuick,
            ExecutionTriggerType triggerType,
            Map<String, Object> payload
    ) {
        Workflow workflow = workflowRepository
                .findById(workflowId)
                .orElseThrow(() -> new IllegalArgumentException("Workflow not found: " + workflowId));
        UUID versionId = workflowVersionRepository.findTopByWorkflow_IdOrderByVersionDesc(workflowId)
                .map(WorkflowVersion::getId)
                .orElse(null);

        try {
            CompletableFuture.runAsync(() -> engine.execute(workflow, id, isQuick, triggerType, payload, versionId))
                    .exceptionally(ex -> {
                        log.error("Async workflow execution failed. workflowId={}, executionId={}", workflowId, id, ex);
                        return null;
                    });
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
