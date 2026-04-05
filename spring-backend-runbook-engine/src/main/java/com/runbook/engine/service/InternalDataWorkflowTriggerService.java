package com.runbook.engine.service;

import com.runbook.engine.domain.ExecutionTriggerType;
import com.runbook.engine.domain.InternalDataChangeType;
import com.runbook.engine.domain.Workflow;
import com.runbook.engine.repository.WorkflowRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class InternalDataWorkflowTriggerService {

    private final WorkflowRepository workflowRepository;
    private final WorkflowRunnerService workflowRunnerService;
    private final ObjectMapper objectMapper;

    public void triggerMatchingWorkflows(
            UUID organizationId,
            String schemaName,
            String tableName,
            InternalDataChangeType changeType,
            Map<String, Object> row
    ) {
        for (Workflow workflow : workflowRepository.findByOrganization_Id(organizationId)) {
            if (workflow.getDefinition() == null || workflow.getDefinition().isBlank()) {
                continue;
            }

            try {
                JsonNode root = objectMapper.readTree(workflow.getDefinition());
                JsonNode nodes = root.path("nodes");
                String sourceNodeId = null;

                for (JsonNode node : nodes) {
                    JsonNode data = node.path("data");
                    if (!"DATA_TRIGGER".equalsIgnoreCase(data.path("type").asText())) {
                        continue;
                    }

                    JsonNode config = data.path("config");
                    String configSchema = config.path("schema").asText("");
                    String configTable = config.path("table").asText("");
                    String configEventType = config.path("eventType").asText("");

                    if (schemaName.equalsIgnoreCase(configSchema)
                            && tableName.equalsIgnoreCase(configTable)
                            && changeType.name().equalsIgnoreCase(configEventType)) {
                        sourceNodeId = node.path("id").asText(null);
                        break;
                    }
                }

                if (sourceNodeId == null) {
                    continue;
                }

                Map<String, Object> payload = new LinkedHashMap<>();
                payload.put("source", sourceNodeId);
                payload.put("eventType", changeType.name());
                payload.put("schema", schemaName);
                payload.put("table", tableName);
                payload.put("row", row);

                workflowRunnerService.run(
                        workflow.getId(),
                        UUID.randomUUID(),
                        false,
                        ExecutionTriggerType.EVENT,
                        payload
                );
            } catch (Exception exception) {
                log.warn("Failed to inspect workflow {} for internal-data triggers", workflow.getId(), exception);
            }
        }
    }
}
