package com.runbook.engine.service;

import com.runbook.engine.controller.dto.WorkflowAnalyticsResponse;
import com.runbook.engine.domain.ExecutionStatus;
import com.runbook.engine.execution.ExecutionEventPublisher;
import com.runbook.engine.repository.ExecutionLogRepository;
import com.runbook.engine.repository.NodeExecutionRepository;
import com.runbook.engine.repository.WorkflowExecutionRepository;
import com.runbook.engine.repository.WorkflowRepository;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

class WorkflowExecutionServiceTest {

    @Test
    void getWorkflowAnalyticsReturnsEmptyWhenOrganizationHasNoWorkflows() {
        ExecutionEventPublisher publisher = mock(ExecutionEventPublisher.class);
        WorkflowExecutionRepository workflowExecutionRepository = mock(WorkflowExecutionRepository.class);
        NodeExecutionRepository nodeExecutionRepository = mock(NodeExecutionRepository.class);
        ExecutionLogRepository executionLogRepository = mock(ExecutionLogRepository.class);
        WorkflowRepository workflowRepository = mock(WorkflowRepository.class);
        WorkflowExecutionService service = new WorkflowExecutionService(
                publisher,
                workflowExecutionRepository,
                nodeExecutionRepository,
                executionLogRepository,
                workflowRepository
        );

        UUID orgId = UUID.randomUUID();
        when(workflowRepository.findIdsByOrganizationId(orgId)).thenReturn(List.of());

        WorkflowAnalyticsResponse response = service.getWorkflowAnalytics(orgId);

        assertEquals(new WorkflowAnalyticsResponse(0, 0, 0, 0), response);
        verifyNoInteractions(workflowExecutionRepository);
    }

    @Test
    void getWorkflowAnalyticsCountsRunsByStatusAcrossOrganizationWorkflows() {
        ExecutionEventPublisher publisher = mock(ExecutionEventPublisher.class);
        WorkflowExecutionRepository workflowExecutionRepository = mock(WorkflowExecutionRepository.class);
        NodeExecutionRepository nodeExecutionRepository = mock(NodeExecutionRepository.class);
        ExecutionLogRepository executionLogRepository = mock(ExecutionLogRepository.class);
        WorkflowRepository workflowRepository = mock(WorkflowRepository.class);
        WorkflowExecutionService service = new WorkflowExecutionService(
                publisher,
                workflowExecutionRepository,
                nodeExecutionRepository,
                executionLogRepository,
                workflowRepository
        );

        UUID orgId = UUID.randomUUID();
        List<UUID> workflowIds = List.of(UUID.randomUUID(), UUID.randomUUID());

        when(workflowRepository.findIdsByOrganizationId(orgId)).thenReturn(workflowIds);
        when(workflowExecutionRepository.countByWorkflowIdIn(workflowIds)).thenReturn(1248L);
        when(workflowExecutionRepository.countByWorkflowIdInAndStatus(workflowIds, ExecutionStatus.SUCCESS)).thenReturn(1102L);
        when(workflowExecutionRepository.countByWorkflowIdInAndStatus(workflowIds, ExecutionStatus.FAILED)).thenReturn(86L);
        when(workflowExecutionRepository.countByWorkflowIdInAndStatus(workflowIds, ExecutionStatus.RUNNING)).thenReturn(60L);

        WorkflowAnalyticsResponse response = service.getWorkflowAnalytics(orgId);

        assertEquals(new WorkflowAnalyticsResponse(1248, 1102, 86, 60), response);
    }
}
