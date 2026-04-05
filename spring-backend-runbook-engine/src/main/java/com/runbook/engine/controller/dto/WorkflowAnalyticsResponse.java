package com.runbook.engine.controller.dto;

public record WorkflowAnalyticsResponse(
        long totalRuns,
        long successRuns,
        long failedRuns,
        long runningRuns
) {
    public static WorkflowAnalyticsResponse empty() {
        return new WorkflowAnalyticsResponse(0, 0, 0, 0);
    }
}
