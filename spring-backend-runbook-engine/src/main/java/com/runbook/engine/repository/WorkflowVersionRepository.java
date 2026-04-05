package com.runbook.engine.repository;

import com.runbook.engine.domain.WorkflowVersion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WorkflowVersionRepository extends JpaRepository<WorkflowVersion, UUID> {
    Optional<WorkflowVersion> findTopByWorkflow_IdOrderByVersionDesc(UUID workflowId);
    List<WorkflowVersion> findByWorkflow_IdOrderByVersionDesc(UUID workflowId);
}
