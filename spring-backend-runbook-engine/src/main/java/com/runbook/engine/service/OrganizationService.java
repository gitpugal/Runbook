package com.runbook.engine.service;

import com.runbook.engine.controller.dto.CreateOrgRequest;
import com.runbook.engine.controller.dto.MemberDeleteRequest;
import com.runbook.engine.controller.dto.MemberResponse;
import com.runbook.engine.controller.dto.OrganizationResponse;
import com.runbook.engine.domain.*;
import com.runbook.engine.repository.OrgInviteRepository;
import com.runbook.engine.repository.OrganizationMemberRepository;
import com.runbook.engine.repository.OrganizationRepository;
import com.runbook.engine.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class OrganizationService {

    private final OrganizationRepository orgRepo;
    private final OrganizationMemberRepository memberRepo;
    private final UserRepository userRepository;
    private final OrgInviteRepository orgInviteRepository;


    public Organization createOrganization(CreateOrgRequest request) {
        Organization org = new Organization();
        org.setId(UUID.randomUUID());
        org.setName(request.getName());
        org.setCreatedAt(Instant.now());
        org.setUpdatedAt(Instant.now());

        orgRepo.save(org);
        User user = userRepository.findByEmail(request.getEmail()).orElseThrow(() -> new RuntimeException("User Not Found"));

        OrganizationMember member = new OrganizationMember();
        member.setId(UUID.randomUUID());
        member.setOrganization(org);
        member.setUser(user);
        member.setRole(OrgRole.ADMIN);
        member.setJoinedAt(Instant.now());

        memberRepo.save(member);

        return org;
    }

    public OrganizationResponse getOrganization(UUID id) {
        Organization org = orgRepo.findById(id).orElseThrow(() -> new RuntimeException("Organization not found"));

        List<MemberResponse> members = org.getMembers().stream().map(m -> new MemberResponse(m.getUser().getId(), m.getUser().getEmail(), m.getRole())).toList();

        return new OrganizationResponse(org.getId(), org.getName(), members);
    }


    public void deleteMember(MemberDeleteRequest request) {
        User user = userRepository.findByEmail(request.getRequesterEmail()).orElseThrow(() -> new RuntimeException("User not found"));
        User delUser = userRepository.findById(request.getUserId()).orElseThrow(() -> new RuntimeException("User not found"));
        orgRepo.findById(request.getOrgId()).orElseThrow(() -> new RuntimeException("Organization not found"));

        boolean isAdmin = memberRepo.existsByOrganization_IdAndUser_IdAndRole(request.getOrgId(), user.getId(), OrgRole.ADMIN);

        if (!isAdmin) {
            throw new RuntimeException("Sender is not an admin of this organization");
        }
        orgInviteRepository.deleteByOrganization_IdAndEmail(request.getOrgId(), delUser.getEmail());
        memberRepo.deleteByOrganization_IdAndUser_Id(request.getOrgId(), request.getUserId());

    }
}
