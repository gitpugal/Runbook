package com.runbook.engine.controller.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class TableColumnDTO {
    private String name;
    private String type; // string | number | date | boolean
    private List<String> operators;
    private boolean updatable;
}
