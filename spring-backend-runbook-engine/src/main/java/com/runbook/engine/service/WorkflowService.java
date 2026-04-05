package com.runbook.engine.service;

import com.runbook.engine.controller.dto.CreateWorkflowRequest;
import com.runbook.engine.controller.dto.SaveWorkflowRequest;
import com.runbook.engine.controller.dto.UpdateWorkflowRequest;
import com.runbook.engine.controller.dto.WorkflowResponse;
import com.runbook.engine.domain.*;
import com.runbook.engine.execution.WorkflowScheduleService;
import com.runbook.engine.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WorkflowService {

    private final WorkflowRepository workflowRepo;
    private final UserRepository userRepository;
    private final OrganizationMemberRepository organizationMemberRepository;
    private final OrganizationRepository organizationRepository;
    private final OrgDatabaseRepository orgDatabaseRepository;
    private final WorkflowScheduleService workflowScheduleService;
    private final WorkflowVersionRepository workflowVersionRepository;
    private final ObjectMapper objectMapper;


    public List<Workflow> getWorkflows(UUID orgId) {
        return workflowRepo.findByOrganization_IdOrderByUpdatedAtDesc(orgId);
    }

    public Workflow getWorkflowEntity(UUID id) {
        return workflowRepo.findById(id).orElseThrow();
    }


    public Workflow createWorkflow(CreateWorkflowRequest request) {
        User user = userRepository.findByEmail(request.getEmail()).orElseThrow(() -> new RuntimeException(("User Not Found")));
        organizationMemberRepository.findByUser_IdAndOrganization_Id(user.getId(), request.getOrgId()).orElseThrow(() -> new RuntimeException("User doesn't have access to Organization"));
        Organization organization = organizationRepository.findById(request.getOrgId()).orElseThrow(() -> new RuntimeException("Organization not Found"));
        Workflow workflow = Workflow.builder()
                .id(UUID.randomUUID())
                .name(request.getName())
                .status(WorkflowStatus.DRAFT)
                .organization(organization)
                .createdBy(user)
                .build();
        return workflowRepo.save(workflow);
    }

    public WorkflowResponse getWorkflow(UUID workFlowId) {
        Workflow wf = workflowRepo.findById(workFlowId).orElseThrow(() -> new RuntimeException("Workflow not found"));
        OrgDatabase orgDatabase = wf.getOrgDatabase();
        return WorkflowResponse.builder()
                .id(wf.getId())
                .name(wf.getName())
                .status(wf.getStatus().toString())
                .definition(wf.getDefinition())
                .database(orgDatabase != null ? orgDatabase.getName() : null)
                .dbId(orgDatabase != null ? orgDatabase.getId() : null)
                .scheduled(wf.getScheduled())
                .cronString(wf.getCronString())
                .build();
    }

    public WorkflowResponse updateWorkflow(UUID workflowId, UpdateWorkflowRequest request) {

        Workflow wf = workflowRepo.findById(workflowId)
                .orElseThrow(() -> new RuntimeException("Workflow not found"));

        // 🔐 Authorization check
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        organizationMemberRepository
                .findByUser_IdAndOrganization_Id(user.getId(), wf.getOrganization().getId())
                .orElseThrow(() -> new RuntimeException("User not authorized for this organization"));

        // ✏️ Update fields
        if (request.getName() != null && !request.getName().isBlank()) {
            wf.setName(request.getName());
        }

        if (request.getScheduled() != null) {
            wf.setScheduled(request.getScheduled());
        }

        if (request.getCronString() != null) {
            wf.setCronString(request.getCronString());
        }

        wf.setUpdatedAt(Instant.now()); // ⏱️ important

        workflowRepo.save(wf);

        if (Boolean.TRUE.equals(wf.getScheduled())) {

            workflowScheduleService.rescheduleWorkflow(wf);

        } else {

            workflowScheduleService.removeSchedule(wf.getId());
        }

        return WorkflowResponse.builder()
                .id(wf.getId())
                .name(wf.getName())
                .status(wf.getStatus().toString())
                .build();
    }

    public WorkflowResponse saveWorkflow(UUID workflowId, SaveWorkflowRequest request) {

        Workflow wf = workflowRepo.findById(workflowId)
                .orElseThrow(() -> new RuntimeException("Workflow not found"));

        // Validate user
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Validate org membership
        organizationMemberRepository
                .findByUser_IdAndOrganization_Id(user.getId(), wf.getOrganization().getId())
                .orElseThrow(() -> new RuntimeException("No access to organization"));
        OrgDatabase orgDatabase = null;
        if (request.getOrgDatabaseId() != null) {
            orgDatabase = orgDatabaseRepository.findById(request.getOrgDatabaseId())
                    .orElseThrow(() -> new RuntimeException("Database not found"));
        }

        // Update name
        if (request.getName() != null && !request.getName().isBlank()) {
            wf.setName(request.getName());
        }

        try {
            Map<String, Object> definition = Map.of(
                    "nodes", request.getNodes(),
                    "edges", request.getEdges()
            );

            wf.setDefinition(objectMapper.writeValueAsString(definition));

        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize workflow", e);
        }

        wf.setUpdatedAt(Instant.now());
        wf.setOrgDatabase(orgDatabase);

        workflowRepo.save(wf);
        createWorkflowVersion(wf);

        return WorkflowResponse.builder()
                .id(wf.getId())
                .name(wf.getName())
                .status(wf.getStatus().toString())
                .build();
    }


    public void deleteWorkFlow(UUID workFlowId) {
        workflowRepo.deleteById(workFlowId);
    }

    private void createWorkflowVersion(Workflow workflow) {
        int nextVersion = workflowVersionRepository.findTopByWorkflow_IdOrderByVersionDesc(workflow.getId())
                .map(existing -> existing.getVersion() + 1)
                .orElse(1);

        workflowVersionRepository.save(
                WorkflowVersion.builder()
                        .id(UUID.randomUUID())
                        .workflow(workflow)
                        .version(nextVersion)
                        .definition(workflow.getDefinition())
                        .createdAt(Instant.now())
                        .build()
        );
    }
}
