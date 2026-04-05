package com.runbook.engine.execution.executors.tools;

import com.runbook.engine.execution.ExecutionContext;
import com.runbook.engine.execution.graph.WorkflowNode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.LinkedHashMap;
import java.util.Map;

@Component("ai_tool")
public class AiTool implements ToolExecutor {

    private final RestClient restClient = RestClient.create();

    @Override
    public Object execute(WorkflowNode node, ExecutionContext context) {
        Map<String, Object> config = node.getConfigOrEmpty();
        String url = String.valueOf(config.get("url"));
        String apiKey = String.valueOf(config.getOrDefault("apiKey", ""));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", config.getOrDefault("model", "gpt-4o-mini"));
        body.put("input", config.getOrDefault("input", ""));

        RestClient.RequestBodySpec request = restClient.post()
                .uri(url)
                .contentType(MediaType.APPLICATION_JSON);
        if (!apiKey.isBlank()) {
            request.header("Authorization", "Bearer " + apiKey);
        }

        String response = request.body(body)
                .retrieve()
                .body(String.class);

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("model", body.get("model"));
        summary.put("response", response);
        return summary;
    }

    @Override
    public String getType() {
        return "ai_tool";
    }
}
