package com.runbook.engine.controller.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateOrgRequest {

    @NotBlank
    private String name;
    private String email;
}
