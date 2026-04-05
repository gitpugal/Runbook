package com.runbook.engine.controller.dto;

import com.runbook.engine.domain.OrgRole;
import lombok.Data;

@Data
public class CreateInviteRequest {
    private String email;
    private OrgRole role;
    private String sender;
}
