package com.runbook.engine.repository;

import com.runbook.engine.controller.dto.OrgDatabaseResponse;
import com.runbook.engine.domain.OrgDatabase;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface OrgDatabaseRepository extends JpaRepository<OrgDatabase, UUID> {
    List<OrgDatabase> findByOrganizationId(UUID orgId);
    List<OrgDatabaseResponse> findByOrganization_Id(UUID id);
}
