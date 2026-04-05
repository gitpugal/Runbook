package com.runbook.engine.controller.dto;

import com.runbook.engine.execution.ExecutionLog;

import java.time.Instant;
import java.util.UUID;

public record ExecutionLogResponse(
        UUID id,
        UUID executionId,
        String nodeId,
        Instant timestamp,
        String level,
        String message
) {
    public static ExecutionLogResponse from(ExecutionLog log) {
        return new ExecutionLogResponse(
                log.getId(),
                log.getExecutionId(),
                log.getNodeId(),
                log.getTimestamp(),
                log.getLevel(),
                log.getMessage()
        );
    }
}
