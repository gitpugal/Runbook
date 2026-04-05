package com.runbook.engine.controller;

import com.runbook.engine.controller.dto.*;
import com.runbook.engine.domain.Organization;
import com.runbook.engine.security.AuthService;
import com.runbook.engine.service.OrgInviteService;
import com.runbook.engine.service.OrganizationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/orgs")
public class OrganizationController {

    private final OrganizationService orgService;
    private final OrgInviteService inviteService;

    public OrganizationController(OrganizationService orgService,
                                  AuthService authService, OrgInviteService inviteService) {
        this.orgService = orgService;
        this.inviteService = inviteService;
    }

    @PostMapping
    public UUID createOrg(
            Authentication authentication,
            @Valid @RequestBody CreateOrgRequest request
    ) {
        Organization org = orgService.createOrganization(request);
        return org.getId();
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrganizationResponse> getOrganization(@PathVariable UUID id) {
        return ResponseEntity.ok(orgService.getOrganization(id));
    }

    @GetMapping("/{orgId}/invitations/sent")
    public List<SentInviteResponse> getSentInvites(@PathVariable UUID orgId) {
        return inviteService.getSentInvites(orgId);
    }

    @DeleteMapping("/{orgId}/members")
    public void deleteMember(@RequestBody MemberDeleteRequest request){
        orgService.deleteMember(request);
    }
}
