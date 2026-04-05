package com.runbook.engine.repository;

import com.runbook.engine.domain.OrganizationEnvironment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrganizationEnvironmentRepository extends JpaRepository<OrganizationEnvironment, UUID> {
    List<OrganizationEnvironment> findByOrganization_Id(UUID organizationId);

    OrganizationEnvironment findByOrganization_IdAndName(UUID organizationId, String domainName);

    OrganizationEnvironment findByOrganization_IdAndId(UUID organizationId, UUID schemaId);
}
