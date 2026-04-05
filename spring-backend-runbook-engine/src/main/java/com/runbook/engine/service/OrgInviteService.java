package com.runbook.engine.service;

import com.runbook.engine.controller.dto.CreateInviteRequest;
import com.runbook.engine.controller.dto.ReceivedInviteResponse;
import com.runbook.engine.controller.dto.SentInviteResponse;
import com.runbook.engine.domain.*;
import com.runbook.engine.repository.*;
import com.runbook.engine.security.NotificationService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class OrgInviteService {

    private final OrgInviteRepository inviteRepo;
    private final OrganizationRepository orgRepo;
    private final UserRepository userRepo;
    private final OrganizationMemberRepository memberRepo;
    private final NotificationService notificationService;

    // ================== SENT INVITES (ORG SCOPE) ==================
    public List<SentInviteResponse> getSentInvites(UUID orgId) {
        return inviteRepo.findByOrganization_Id(orgId).stream()
                .filter(invite -> !invite.isAccepted())
                .map(invite -> new SentInviteResponse(
                        invite.getId(),
                        invite.getEmail(),
                        invite.getRole()
                ))
                .toList();
    }

    // ================== RECEIVED INVITES (USER SCOPE) ==================
    public List<ReceivedInviteResponse> getReceivedInvites(String userEmail) {
        return inviteRepo.findByEmailIgnoreCase(userEmail).stream()
                .filter(invite -> !invite.isAccepted())
                .map(invite -> new ReceivedInviteResponse(
                        invite.getId(),
                        invite.getOrganization().getId(),   // ✅ Needed for redirect
                        invite.getOrganization().getName(),
                        invite.getRole()
                ))
                .toList();
    }

    // ================== CANCEL SENT INVITE ==================
    public void cancelInvite(UUID inviteId) {
        inviteRepo.deleteById(inviteId);
    }

    // ================== ACCEPT INVITE ==================
    public void acceptInvite(UUID inviteId, String userEmail) {
        OrgInvite invite = inviteRepo.findById(inviteId)
                .orElseThrow(() -> new RuntimeException("Invite not found"));

        if (!invite.getEmail().equalsIgnoreCase(userEmail)) {
            throw new RuntimeException("Not authorized to accept this invite");
        }

        User user = userRepo.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Organization org = invite.getOrganization();

        // 🚫 Prevent duplicate membership
        boolean alreadyMember = memberRepo.existsByOrganization_IdAndUser_Id(org.getId(), user.getId());
        if (!alreadyMember) {
            OrganizationMember member = new OrganizationMember();
            member.setId(UUID.randomUUID());
            member.setOrganization(org);
            member.setUser(user);
            member.setRole(invite.getRole());
            member.setJoinedAt(Instant.now());
            memberRepo.save(member);
        }

        invite.setAccepted(true);  // mark invite as completed
        inviteRepo.save(invite);
    }

    // ================== REJECT INVITE ==================
    public void rejectInvite(UUID inviteId, String userEmail) {
        OrgInvite invite = inviteRepo.findById(inviteId)
                .orElseThrow(() -> new RuntimeException("Invite not found"));

        if (!invite.getEmail().equalsIgnoreCase(userEmail)) {
            throw new RuntimeException("Not authorized to reject this invite");
        }

        inviteRepo.delete(invite);
    }

    public SentInviteResponse createInvite(UUID orgId, CreateInviteRequest request) {

        Organization org = orgRepo.findById(orgId)
                .orElseThrow(() -> new RuntimeException("Organization not found"));

        // 🔐 Verify sender is ADMIN of this org
        User sender = userRepo.findByEmail(request.getSender())
                .orElseThrow(() -> new RuntimeException("Sender does not exist"));

        boolean isAdmin = memberRepo.existsByOrganization_IdAndUser_IdAndRole(
                orgId, sender.getId(), OrgRole.ADMIN);

        if (!isAdmin) {
            throw new RuntimeException("Sender is not an admin of this organization");
        }

        // 🚫 Check if invited user is already a member (ANY role)
        userRepo.findByEmail(request.getEmail()).ifPresent(user -> {
            boolean alreadyMember = memberRepo.existsByOrganization_IdAndUser_Id(orgId, user.getId());
            if (alreadyMember) {
                throw new RuntimeException("User is already a member of this organization");
            }
        });

        // 🚫 Prevent duplicate pending invite
        boolean inviteExists = inviteRepo.findByOrganization_Id(orgId).stream()
                .anyMatch(inv ->
                        inv.getEmail().equalsIgnoreCase(request.getEmail())
                                && !inv.isAccepted()
                );

        if (inviteExists) {
            throw new RuntimeException("An active invite already exists for this email");
        }
//        inviteRepo.deleteByOrganization_IdAndEmail(orgId, request.getEmail());

        OrgInvite invite = new OrgInvite();
        invite.setId(UUID.randomUUID());
        invite.setEmail(request.getEmail());
        invite.setRole(request.getRole());
        invite.setAccepted(false);
        invite.setCreatedAt(Instant.now());
        invite.setOrganization(org);
        invite.setInvitedBy(sender); // good to track

        inviteRepo.save(invite);


        notificationService.sendOrgInviteNotification(
                invite.getEmail(),
                org,
                invite.getId()
        );

        return new SentInviteResponse(
                invite.getId(),
                invite.getEmail(),
                invite.getRole()
        );
    }

}
