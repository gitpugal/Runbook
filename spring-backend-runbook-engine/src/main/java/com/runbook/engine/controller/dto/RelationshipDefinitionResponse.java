package com.runbook.engine.controller.dto;

import com.runbook.engine.domain.RelationshipDefinition;
import com.runbook.engine.domain.RelationshipType;
import lombok.Builder;

import java.util.UUID;

@Builder
public record RelationshipDefinitionResponse(
        UUID id,
        UUID sourceEntityId,
        UUID targetEntityId,
        String sourceEntityName,
        String targetEntityName,
        RelationshipType type,
        String sourceColumn,
        String targetColumn
) {
    public static RelationshipDefinitionResponse from(RelationshipDefinition relationship) {
        return RelationshipDefinitionResponse.builder()
                .id(relationship.getId())
                .sourceEntityId(relationship.getSourceEntity().getId())
                .targetEntityId(relationship.getTargetEntity().getId())
                .sourceEntityName(relationship.getSourceEntity().getDisplayName())
                .targetEntityName(relationship.getTargetEntity().getDisplayName())
                .type(relationship.getType())
                .sourceColumn(relationship.getSourceColumn())
                .targetColumn(relationship.getTargetColumn())
                .build();
    }
}
