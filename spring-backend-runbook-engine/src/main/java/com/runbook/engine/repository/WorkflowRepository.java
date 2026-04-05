package com.runbook.engine.repository;

import com.runbook.engine.domain.Workflow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface WorkflowRepository extends JpaRepository<Workflow, UUID> {
    List<Workflow> findByOrganization_IdOrderByUpdatedAtDesc(UUID organizationId);
    List<Workflow> findByOrganization_Id(UUID organizationId);
    List<Workflow> findByScheduledTrue();

    @Query("""
SELECT w.id
FROM Workflow w
WHERE w.organization.id = :organizationId
""")
    List<UUID> findIdsByOrganizationId(@Param("organizationId") UUID organizationId);
}
