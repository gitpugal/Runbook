package com.runbook.engine.controller.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ConnectionTestResponse {
    private boolean success;
    private String message;
}
