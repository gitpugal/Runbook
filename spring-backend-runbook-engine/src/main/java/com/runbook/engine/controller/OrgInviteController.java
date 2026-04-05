package com.runbook.engine.controller;

import com.runbook.engine.controller.dto.*;
import com.runbook.engine.service.OrgInviteService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/invitations")
@RequiredArgsConstructor
public class OrgInviteController {

    private final OrgInviteService inviteService;


    @PostMapping("/{orgId}")
    public SentInviteResponse createInvite(
            @PathVariable UUID orgId,
            @RequestBody CreateInviteRequest request
    ) {
        return inviteService.createInvite(orgId, request);
    }

    @PostMapping("/{inviteId}/cancel")
    public void cancelInvite(@PathVariable UUID inviteId) {
        inviteService.cancelInvite(inviteId);
    }

    @PostMapping("/{inviteId}/accept")
    public void acceptInvite(
            @PathVariable UUID inviteId,
            @RequestParam String email
    ) {
        inviteService.acceptInvite(inviteId, email);
    }

    @PostMapping("/{inviteId}/reject")
    public void rejectInvite(
            @PathVariable UUID inviteId,
            @RequestParam String email
    ) {
        inviteService.rejectInvite(inviteId, email);
    }


    @GetMapping("/received")
    public List<ReceivedInviteResponse> getReceivedInvites(
            @RequestParam String email
    ) {
        return inviteService.getReceivedInvites(email);
    }
}
