package com.runbook.engine.controller.dto;

import com.runbook.engine.domain.OrgRole;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.UUID;

@Data
@AllArgsConstructor
public class MemberResponse {
    private UUID userId;
    private String email;
    private OrgRole role;
}
