package com.runbook.engine.repository;

import com.runbook.engine.domain.ExecutionStatus;
import com.runbook.engine.execution.WorkflowExecution;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface WorkflowExecutionRepository 
        extends JpaRepository<WorkflowExecution, UUID> {
    List<WorkflowExecution> findByWorkflowIdOrderByStartedAtDesc(UUID workflowId);
    long countByWorkflowIdIn(List<UUID> workflowIds);
    long countByWorkflowIdInAndStatus(List<UUID> workflowIds, ExecutionStatus status);
}
