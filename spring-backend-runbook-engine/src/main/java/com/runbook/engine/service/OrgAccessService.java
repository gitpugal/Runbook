package com.runbook.engine.service;

import com.runbook.engine.domain.Organization;
import com.runbook.engine.domain.OrganizationMember;
import com.runbook.engine.domain.User;
import com.runbook.engine.repository.OrganizationMemberRepository;
import com.runbook.engine.repository.OrganizationRepository;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class OrgAccessService {

    private final OrganizationMemberRepository memberRepo;
    private final OrganizationRepository orgRepo;

    public OrgAccessService(OrganizationMemberRepository memberRepo,
                            OrganizationRepository orgRepo) {
        this.memberRepo = memberRepo;
        this.orgRepo = orgRepo;
    }

    public Organization getOrgIfMember(User user, UUID orgId) {
        memberRepo.findByUser_IdAndOrganization_Id(user.getId(), orgId)
                .orElseThrow(() -> new RuntimeException("Access denied to this organization"));

        return orgRepo.findById(orgId)
                .orElseThrow(() -> new RuntimeException("Organization not found"));
    }
}
