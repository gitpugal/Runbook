package com.runbook.engine.execution.executors.tools;

import com.runbook.engine.execution.ExecutionContext;
import com.runbook.engine.execution.graph.WorkflowNode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.LinkedHashMap;
import java.util.Map;

@Component("slack_tool")
public class SlackTool implements ToolExecutor {

    private final RestClient restClient = RestClient.create();

    @Override
    public Object execute(WorkflowNode node, ExecutionContext context) {
        Map<String, Object> config = node.getConfigOrEmpty();
        String webhookUrl = String.valueOf(config.get("webhookUrl"));
        Object body = config.getOrDefault("body", Map.of("text", config.getOrDefault("text", "")));

        String response = restClient.post()
                .uri(webhookUrl)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(String.class);

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("webhookUrl", webhookUrl);
        summary.put("response", response);
        return summary;
    }

    @Override
    public String getType() {
        return "slack_tool";
    }
}
