package com.runbook.engine.controller.dto;

import lombok.Data;

@Data
public class CreateInternalDataDomainRequest {
    private String name;
    private String description;
}
