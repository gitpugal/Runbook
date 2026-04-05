package com.runbook.engine.controller.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Getter
public class TestConnectionResponse {
    private boolean success;
    private String message;
}
