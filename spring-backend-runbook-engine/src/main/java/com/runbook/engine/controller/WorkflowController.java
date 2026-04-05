package com.runbook.engine.controller;

import com.runbook.engine.controller.dto.CreateWorkflowRequest;
import com.runbook.engine.controller.dto.ExecutionLogResponse;
import com.runbook.engine.controller.dto.SaveWorkflowRequest;
import com.runbook.engine.controller.dto.TriggerWorkflowRequest;
import com.runbook.engine.controller.dto.UpdateWorkflowRequest;
import com.runbook.engine.controller.dto.WorkflowExecutionDetailResponse;
import com.runbook.engine.controller.dto.WorkflowExecutionSummaryResponse;
import com.runbook.engine.controller.dto.WorkflowResponse;
import com.runbook.engine.domain.ExecutionTriggerType;
import com.runbook.engine.domain.Workflow;
import com.runbook.engine.service.WorkflowExecutionService;
import com.runbook.engine.service.WorkflowRunnerService;
import com.runbook.engine.service.WorkflowService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/workflow")
@RequiredArgsConstructor
public class WorkflowController {

    private final WorkflowService workflowService;
    private final WorkflowRunnerService workflowRunnerService;
    private final WorkflowExecutionService executionService;


    @PostMapping
    public WorkflowResponse createWorkFlow(@RequestBody CreateWorkflowRequest request) {
        Workflow workflow = workflowService.createWorkflow(request);
        return WorkflowResponse.from(workflow);
    }


    @GetMapping
    public List<WorkflowResponse> getWorkflows(@RequestParam("orgId") UUID orgId) {
        return workflowService.getWorkflows(orgId).stream().map(WorkflowResponse::from).toList();
    }

    @GetMapping("/{workFlowId}")
    public WorkflowResponse getWorkFlow(@PathVariable UUID workFlowId) {
        return workflowService.getWorkflow(workFlowId);
    }

    @DeleteMapping("/{workFlowId}")
    public void deleteWorkflow(@PathVariable UUID workFlowId) {
        workflowService.deleteWorkFlow(workFlowId);
    }

    @PutMapping("/{workFlowId}")
    public WorkflowResponse updateWorkflow(@PathVariable UUID workFlowId, @RequestBody UpdateWorkflowRequest request) {
        return workflowService.updateWorkflow(workFlowId, request);
    }

    @PutMapping("/{workflowId}/save")
    public WorkflowResponse saveWorkflow(@PathVariable UUID workflowId, @RequestBody SaveWorkflowRequest request) {
        return workflowService.saveWorkflow(workflowId, request);
    }

    @GetMapping("/{workflowId}/run")
    public void run(@PathVariable UUID workflowId, @RequestParam UUID executionId, @RequestParam boolean isQuick) {
        workflowRunnerService.run(
                workflowId,
                executionId,
                isQuick,
                isQuick ? ExecutionTriggerType.QUICK_RUN : ExecutionTriggerType.MANUAL,
                java.util.Map.of()
        );
    }

    @GetMapping(value = "/executions/{executionId}/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@PathVariable UUID executionId) {
        return executionService.subscribe(executionId);
    }

    @GetMapping("/{id}/executions")
    public List<WorkflowExecutionSummaryResponse> getExecutions(@PathVariable UUID id) {
        return executionService.getWorkflowExecutions(id);
    }

    @GetMapping("/executions/{executionId}")
    public WorkflowExecutionDetailResponse getExecution(@PathVariable UUID executionId) {
        return executionService.getExecution(executionId);
    }

    @GetMapping("/executions/{executionId}/logs")
    public List<ExecutionLogResponse> getExecutionLogs(@PathVariable UUID executionId) {
        return executionService.getExecutionLogs(executionId);
    }

    @PostMapping("/trigger/{workflowId}")
    public UUID triggerWorkflow(@PathVariable UUID workflowId, @RequestBody(required = false) TriggerWorkflowRequest request) {
        UUID executionId = UUID.randomUUID();
        workflowRunnerService.run(
                workflowId,
                executionId,
                false,
                ExecutionTriggerType.EVENT,
                request == null ? java.util.Map.of() : request.getPayload()
        );
        return executionId;
    }

}
