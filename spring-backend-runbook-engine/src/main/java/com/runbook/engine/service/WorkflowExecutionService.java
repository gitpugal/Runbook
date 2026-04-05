package com.runbook.engine.service;

import com.runbook.engine.controller.dto.WorkflowAnalyticsResponse;
import com.runbook.engine.controller.dto.ExecutionLogResponse;
import com.runbook.engine.controller.dto.NodeExecutionResponse;
import com.runbook.engine.controller.dto.WorkflowExecutionDetailResponse;
import com.runbook.engine.controller.dto.WorkflowExecutionSummaryResponse;
import com.runbook.engine.domain.ExecutionStatus;
import com.runbook.engine.execution.ExecutionEventPublisher;
import com.runbook.engine.execution.WorkflowExecution;
import com.runbook.engine.repository.ExecutionLogRepository;
import com.runbook.engine.repository.NodeExecutionRepository;
import com.runbook.engine.repository.WorkflowExecutionRepository;
import com.runbook.engine.repository.WorkflowRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WorkflowExecutionService {

    private final ExecutionEventPublisher publisher;
    private final WorkflowExecutionRepository workflowExecutionRepository;
    private final NodeExecutionRepository nodeExecutionRepository;
    private final ExecutionLogRepository executionLogRepository;
    private final WorkflowRepository workflowRepository;


    public SseEmitter subscribe(UUID executionId) {
        return publisher.subscribe(executionId);
    }

    public List<WorkflowExecutionSummaryResponse> getWorkflowExecutions(UUID workflowId) {
        return workflowExecutionRepository.findByWorkflowIdOrderByStartedAtDesc(workflowId).stream()
                .map(WorkflowExecutionSummaryResponse::from)
                .toList();
    }

    public WorkflowAnalyticsResponse getWorkflowAnalytics(UUID orgId) {
        List<UUID> workflowIds = workflowRepository.findIdsByOrganizationId(orgId);

        if (workflowIds.isEmpty()) {
            return WorkflowAnalyticsResponse.empty();
        }

        return new WorkflowAnalyticsResponse(
                workflowExecutionRepository.countByWorkflowIdIn(workflowIds),
                workflowExecutionRepository.countByWorkflowIdInAndStatus(workflowIds, ExecutionStatus.SUCCESS),
                workflowExecutionRepository.countByWorkflowIdInAndStatus(workflowIds, ExecutionStatus.FAILED),
                workflowExecutionRepository.countByWorkflowIdInAndStatus(workflowIds, ExecutionStatus.RUNNING)
        );
    }

    public WorkflowExecutionDetailResponse getExecution(UUID executionId) {
        WorkflowExecution execution = workflowExecutionRepository.findById(executionId)
                .orElseThrow(() -> new IllegalArgumentException("Execution not found: " + executionId));
        List<NodeExecutionResponse> nodes = nodeExecutionRepository.findByExecutionIdOrderByStartedAtAsc(executionId).stream()
                .map(NodeExecutionResponse::from)
                .toList();
        return WorkflowExecutionDetailResponse.from(execution, nodes);
    }

    public List<ExecutionLogResponse> getExecutionLogs(UUID executionId) {
        return executionLogRepository.findByExecutionIdOrderByTimestampAsc(executionId).stream()
                .map(ExecutionLogResponse::from)
                .toList();
    }
}
