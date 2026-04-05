package com.runbook.engine.repository;

import com.runbook.engine.execution.NodeExecution;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface NodeExecutionRepository extends JpaRepository<NodeExecution, UUID> {
    List<NodeExecution> findByExecutionIdOrderByStartedAtAsc(UUID executionId);
}
