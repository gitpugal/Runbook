package com.runbook.engine.controller;

import com.runbook.engine.controller.dto.WorkflowAnalyticsResponse;
import com.runbook.engine.service.WorkflowExecutionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping({"/api/v1/org", "/api/v1/orgs"})
@RequiredArgsConstructor
public class OrgWorkflowAnalyticsController {

    private final WorkflowExecutionService workflowExecutionService;

    @GetMapping("/{orgId}/workflow-analytics")
    public WorkflowAnalyticsResponse getWorkflowAnalytics(@PathVariable UUID orgId) {
        return workflowExecutionService.getWorkflowAnalytics(orgId);
    }
}
