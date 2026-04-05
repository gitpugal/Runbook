package com.runbook.engine.controller.dto;

import com.runbook.engine.domain.OrgRole;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.UUID;

@Data
@AllArgsConstructor
public class ReceivedInviteResponse {
    private UUID id;
    private UUID orgId;   // ADD THIS
    private String orgName;
    private OrgRole role;
}

