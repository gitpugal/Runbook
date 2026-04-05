package com.runbook.engine.controller.dto;

import lombok.Data;

import java.util.HashMap;
import java.util.Map;

@Data
public class InternalRowUpsertRequest {
    private Map<String, Object> values = new HashMap<>();
}
