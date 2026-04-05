package com.runbook.engine.controller.dto;

import com.runbook.engine.domain.OrganizationEnvironment;
import lombok.Builder;

import java.time.Instant;
import java.util.UUID;

@Builder
public record OrganizationEnvironmentResponse(
        UUID id,
        UUID organizationId,
        String schemaName,
        Instant createdAt
) {
    public static OrganizationEnvironmentResponse from(OrganizationEnvironment environment) {
        return OrganizationEnvironmentResponse.builder()
                .id(environment.getId())
                .organizationId(environment.getOrganization().getId())
                .schemaName(environment.getSchemaName())
                .createdAt(environment.getCreatedAt())
                .build();
    }
}
