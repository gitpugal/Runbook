package com.runbook.engine.repository;

import com.runbook.engine.execution.ExecutionLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ExecutionLogRepository extends JpaRepository<ExecutionLog, UUID> {
    List<ExecutionLog> findByExecutionIdOrderByTimestampAsc(UUID executionId);
}
