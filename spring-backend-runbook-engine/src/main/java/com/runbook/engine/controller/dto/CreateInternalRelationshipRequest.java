package com.runbook.engine.controller.dto;

import com.runbook.engine.domain.RelationshipType;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateInternalRelationshipRequest {
    private UUID sourceEntityId;
    private UUID targetEntityId;
    private RelationshipType type;
    private String sourceColumn;
    private String targetColumn;
}
