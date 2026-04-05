package com.runbook.engine.controller.dto;

import com.runbook.engine.domain.OrgRole;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.UUID;

@Data
@AllArgsConstructor
public class SentInviteResponse {
    private UUID id;
    private String email;
    private OrgRole role;
}
