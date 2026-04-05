package com.runbook.engine.repository;


import com.runbook.engine.domain.OrgRole;
import com.runbook.engine.domain.OrganizationMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrganizationMemberRepository extends JpaRepository<OrganizationMember, UUID> {

    List<OrganizationMember> findByOrganization_Id(UUID organizationId);

    Optional<OrganizationMember> findByUser_IdAndOrganization_Id(UUID userId, UUID organizationId);

    boolean existsByOrganization_IdAndUser_IdAndRole(UUID organizationId, UUID userId, OrgRole role);
    boolean existsByOrganization_IdAndUser_Id(UUID organizationId, UUID userId);

    void deleteByOrganization_IdAndUser_Id(UUID organizationId, UUID userId);
}
