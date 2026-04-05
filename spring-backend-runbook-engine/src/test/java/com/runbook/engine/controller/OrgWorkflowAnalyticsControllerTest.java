package com.runbook.engine.controller;

import com.runbook.engine.controller.dto.WorkflowAnalyticsResponse;
import com.runbook.engine.service.WorkflowExecutionService;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

class OrgWorkflowAnalyticsControllerTest {

    @Test
    void getWorkflowAnalyticsDelegatesToService() {
        WorkflowExecutionService workflowExecutionService = mock(WorkflowExecutionService.class);
        OrgWorkflowAnalyticsController controller = new OrgWorkflowAnalyticsController(workflowExecutionService);

        UUID orgId = UUID.randomUUID();
        WorkflowAnalyticsResponse expected = new WorkflowAnalyticsResponse(1248, 1102, 86, 60);

        when(workflowExecutionService.getWorkflowAnalytics(orgId)).thenReturn(expected);

        WorkflowAnalyticsResponse actual = controller.getWorkflowAnalytics(orgId);

        assertEquals(expected, actual);
        verify(workflowExecutionService).getWorkflowAnalytics(orgId);
    }
}
