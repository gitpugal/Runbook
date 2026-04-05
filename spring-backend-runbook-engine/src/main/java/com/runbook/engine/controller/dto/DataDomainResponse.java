package com.runbook.engine.controller.dto;

import com.runbook.engine.domain.DataDomain;
import lombok.Builder;

import java.time.Instant;
import java.util.UUID;

@Builder
public record DataDomainResponse(
        UUID id,
        UUID environmentId,
        String name,
        String description,
        Instant createdAt
) {
    public static DataDomainResponse from(DataDomain domain) {
        return DataDomainResponse.builder()
                .id(domain.getId())
                .environmentId(domain.getEnvironment().getId())
                .name(domain.getName())
                .description(domain.getDescription())
                .createdAt(domain.getCreatedAt())
                .build();
    }
}
