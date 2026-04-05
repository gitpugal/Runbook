package com.runbook.engine.controller.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class TableSchemaDTO {
    private String tableName;
    private String primaryKey;
    private List<TableColumnDTO> columns;
}
