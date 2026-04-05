package com.runbook.engine.controller.dto;

import com.runbook.engine.domain.EntityDefinition;
import lombok.Builder;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Builder
public record EntityDefinitionResponse(
        UUID id,
        UUID environmentId,
        UUID domainId,
        String tableName,
        String displayName,
        Instant createdAt,
        List<ColumnDefinitionResponse> columns
) {
    public static EntityDefinitionResponse from(EntityDefinition entity, List<ColumnDefinitionResponse> columns) {
        return EntityDefinitionResponse.builder()
                .id(entity.getId())
                .environmentId(entity.getEnvironment().getId())
                .tableName(entity.getTableName())
                .displayName(entity.getDisplayName())
                .createdAt(entity.getCreatedAt())
                .columns(columns)
                .build();
    }
}
