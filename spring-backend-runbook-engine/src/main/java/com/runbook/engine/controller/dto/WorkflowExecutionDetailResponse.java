package com.runbook.engine.controller.dto;

import com.runbook.engine.execution.WorkflowExecution;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record WorkflowExecutionDetailResponse(
        UUID id,
        UUID workflowId,
        UUID versionId,
        String status,
        String triggerType,
        Instant startedAt,
        Instant finishedAt,
        String contextJson,
        String errorMessage,
        List<NodeExecutionResponse> nodes
) {
    public static WorkflowExecutionDetailResponse from(WorkflowExecution execution, List<NodeExecutionResponse> nodes) {
        return new WorkflowExecutionDetailResponse(
                execution.getId(),
                execution.getWorkflowId(),
                execution.getVersionId(),
                execution.getStatus().name(),
                execution.getTriggerType() == null ? "MANUAL" : execution.getTriggerType().name(),
                execution.getStartedAt(),
                execution.getFinishedAt(),
                execution.getContextJson(),
                execution.getErrorMessage(),
                nodes
        );
    }
}
