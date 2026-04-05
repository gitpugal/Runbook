package com.runbook.engine.controller.dto;


import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class MemberDeleteRequest {
    private String requesterEmail;
    private UUID orgId;
    private UUID userId;
}
