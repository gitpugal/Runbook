package com.runbook.engine.controller.dto;

import com.runbook.engine.execution.WorkflowExecution;

import java.time.Instant;
import java.util.UUID;

public record WorkflowExecutionSummaryResponse(
        UUID id,
        UUID workflowId,
        UUID versionId,
        String status,
        String triggerType,
        Instant startedAt,
        Instant finishedAt,
        String errorMessage
) {
    public static WorkflowExecutionSummaryResponse from(WorkflowExecution execution) {
        return new WorkflowExecutionSummaryResponse(
                execution.getId(),
                execution.getWorkflowId(),
                execution.getVersionId(),
                execution.getStatus().name(),
                execution.getTriggerType() == null ? "MANUAL" : execution.getTriggerType().name(),
                execution.getStartedAt(),
                execution.getFinishedAt(),
                execution.getErrorMessage()
        );
    }
}
