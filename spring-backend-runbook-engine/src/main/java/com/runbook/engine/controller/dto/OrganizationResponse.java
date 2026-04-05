package com.runbook.engine.controller.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
@AllArgsConstructor
public class OrganizationResponse {
    private UUID id;
    private String name;
    private List<MemberResponse> members;
}
