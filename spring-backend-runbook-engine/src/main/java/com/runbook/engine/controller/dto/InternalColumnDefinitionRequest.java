package com.runbook.engine.controller.dto;

import com.runbook.engine.domain.ColumnType;
import lombok.Data;

@Data
public class InternalColumnDefinitionRequest {
    private String columnName;
    private String displayName;
    private ColumnType type;
    private Boolean required;
    private Boolean unique;
    private String defaultValue;
}
