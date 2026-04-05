package com.runbook.engine.controller.dto;


import com.runbook.engine.domain.OrgRole;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class OrganizationWithUserRole {
    private UUID organization_id;
    private String name;
    private OrgRole role;
}
