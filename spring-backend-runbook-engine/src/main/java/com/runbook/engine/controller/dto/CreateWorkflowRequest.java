package com.runbook.engine.controller.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class CreateWorkflowRequest {

    @NotBlank
    private String name;
    private String email;
    private UUID orgId;
}
