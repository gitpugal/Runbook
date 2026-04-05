package com.runbook.engine.controller.dto;

import lombok.Data;

@Data
public class UpdateWorkflowRequest {
    private String name;
    private String email; // who is performing the update
    private Boolean scheduled;
    private String cronString;
}
