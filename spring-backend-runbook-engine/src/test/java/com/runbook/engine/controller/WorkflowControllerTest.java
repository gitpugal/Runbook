package com.runbook.engine.controller;

import com.runbook.engine.controller.dto.TriggerWorkflowRequest;
import com.runbook.engine.domain.ExecutionTriggerType;
import com.runbook.engine.service.WorkflowExecutionService;
import com.runbook.engine.service.WorkflowRunnerService;
import com.runbook.engine.service.WorkflowService;
import org.junit.jupiter.api.Test;

import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class WorkflowControllerTest {

    @Test
    void triggerWorkflowStartsEventExecution() {
        WorkflowService workflowService = mock(WorkflowService.class);
        WorkflowRunnerService workflowRunnerService = mock(WorkflowRunnerService.class);
        WorkflowExecutionService workflowExecutionService = mock(WorkflowExecutionService.class);
        WorkflowController controller = new WorkflowController(workflowService, workflowRunnerService, workflowExecutionService);

        TriggerWorkflowRequest request = new TriggerWorkflowRequest();
        request.setPayload(Map.of("email", "user@example.com"));

        UUID executionId = controller.triggerWorkflow(UUID.randomUUID(), request);

        assertNotNull(executionId);
        verify(workflowRunnerService).run(any(UUID.class), eq(executionId), eq(false), eq(ExecutionTriggerType.EVENT), eq(request.getPayload()));
    }
}
