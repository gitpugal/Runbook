package com.runbook.engine.repository;

import com.runbook.engine.domain.OrgInvite;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface OrgInviteRepository extends JpaRepository<OrgInvite, UUID> {

    List<OrgInvite> findByOrganization_Id(UUID organizationId);

    List<OrgInvite> findByEmailIgnoreCase(String email);

    void deleteByOrganization_IdAndEmail(UUID orgId, String email);
}
