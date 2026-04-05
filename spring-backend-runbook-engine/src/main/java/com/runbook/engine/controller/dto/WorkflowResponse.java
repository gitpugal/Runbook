package com.runbook.engine.controller.dto;

import com.runbook.engine.domain.Workflow;
import lombok.Builder;

import java.util.UUID;

@Builder
public record WorkflowResponse(
        UUID id,
        String name,
        String status,
        String definition,
        String database,
        UUID dbId,
        String cronString,
        Boolean scheduled
) {
    public static WorkflowResponse from(Workflow w) {
        return new WorkflowResponse(
                w.getId(),
                w.getName(),
                w.getStatus().name(),
                w.getDefinition(),
                w.getOrgDatabase() != null ? w.getOrgDatabase().getName() : null,
                w.getOrgDatabase() != null ? w.getOrgDatabase().getId() : null,
                w.getCronString(),
                w.getScheduled()
        );
    }
}
