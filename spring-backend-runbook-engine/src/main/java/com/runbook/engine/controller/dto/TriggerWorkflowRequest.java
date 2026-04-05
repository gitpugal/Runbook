package com.runbook.engine.controller.dto;

import lombok.Data;

import java.util.LinkedHashMap;
import java.util.Map;

@Data
public class TriggerWorkflowRequest {
    private Map<String, Object> payload = new LinkedHashMap<>();
}
