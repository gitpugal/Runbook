package com.runbook.engine.controller.dto;

import lombok.Data;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
public class SaveWorkflowRequest {

    private String name;
    private String email;

    // Store raw canvas JSON
    private Object nodes;
    private Object edges;
    private UUID orgDatabaseId;
}
