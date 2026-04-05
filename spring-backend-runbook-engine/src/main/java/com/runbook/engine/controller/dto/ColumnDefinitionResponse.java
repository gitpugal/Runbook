package com.runbook.engine.controller.dto;

import com.runbook.engine.domain.ColumnDefinition;
import com.runbook.engine.domain.ColumnType;
import lombok.Builder;

import java.time.Instant;
import java.util.UUID;

@Builder
public record ColumnDefinitionResponse(
        UUID id,
        UUID entityId,
        String columnName,
        String displayName,
        ColumnType type,
        boolean required,
        boolean unique,
        String defaultValue,
        Instant createdAt
) {
    public static ColumnDefinitionResponse from(ColumnDefinition definition) {
        return ColumnDefinitionResponse.builder()
                .id(definition.getId())
                .entityId(definition.getEntity().getId())
                .columnName(definition.getColumnName())
                .displayName(definition.getDisplayName())
                .type(definition.getType())
                .required(definition.isRequired())
                .unique(definition.isUniqueColumn())
                .defaultValue(definition.getDefaultValue())
                .createdAt(definition.getCreatedAt())
                .build();
    }
}
