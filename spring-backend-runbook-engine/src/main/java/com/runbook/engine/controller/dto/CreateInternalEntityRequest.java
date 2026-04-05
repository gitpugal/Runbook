package com.runbook.engine.controller.dto;

import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class CreateInternalEntityRequest {
    private UUID domainId;
    private String tableName;
    private String displayName;
    private List<InternalColumnDefinitionRequest> columns;
}
