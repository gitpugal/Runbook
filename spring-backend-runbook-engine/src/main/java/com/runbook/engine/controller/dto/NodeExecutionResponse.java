package com.runbook.engine.controller.dto;

import com.runbook.engine.execution.NodeExecution;

import java.time.Instant;
import java.util.UUID;

public record NodeExecutionResponse(
        UUID id,
        UUID executionId,
        String nodeId,
        String status,
        Instant startedAt,
        Instant finishedAt,
        String inputJson,
        String outputJson,
        String errorMessage
) {
    public static NodeExecutionResponse from(NodeExecution nodeExecution) {
        return new NodeExecutionResponse(
                nodeExecution.getId(),
                nodeExecution.getExecutionId(),
                nodeExecution.getNodeId(),
                nodeExecution.getStatus().name(),
                nodeExecution.getStartedAt(),
                nodeExecution.getFinishedAt(),
                nodeExecution.getInputJson(),
                nodeExecution.getOutputJson(),
                nodeExecution.getErrorMessage()
        );
    }
}
