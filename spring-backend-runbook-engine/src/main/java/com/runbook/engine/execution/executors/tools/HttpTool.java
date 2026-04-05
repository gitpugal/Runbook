package com.runbook.engine.execution.executors.tools;

//import com.fasterxml.jackson.core.type.TypeReference;
//import com.fasterxml.jackson.databind.ObjectMapper;
import com.runbook.engine.execution.ExecutionContext;
import com.runbook.engine.execution.graph.WorkflowNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.net.URI;
import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@Component("http_tool")
public class HttpTool implements ToolExecutor {

    private final RestClient restClient = RestClient.create();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public Object execute(WorkflowNode node, ExecutionContext context) {
        try {

            Map<String, Object> config = node.getConfigOrEmpty();
            log.debug("HTTP tool config: {}", config);

            Map<String, Object> payload = extractPayload(config.get("payload"));

            log.debug("HTTP payload: {}", payload);

            String url = String.valueOf(payload.get("url"));

            if (url == null || url.equals("null") || url.isBlank()) {
                throw new IllegalArgumentException("HTTP tool requires 'url' inside payload");
            }

            if (!url.startsWith("http://") && !url.startsWith("https://")) {
                url = "http://" + url;
            }

            HttpMethod method = HttpMethod.valueOf(
                    String.valueOf(payload.getOrDefault("method", "POST")).toUpperCase()
            );

            Map<String, Object> headers = asMap(payload.get("headers"));
            Object body = payload.getOrDefault("body", Map.of());

            RestClient.RequestBodySpec request = restClient
                    .method(method)
                    .uri(URI.create(url))
                    .contentType(MediaType.APPLICATION_JSON);

            headers.forEach((k, v) -> request.header(k, String.valueOf(v)));

            log.debug("Executing HTTP {} {}", method, url);

            String response = request
                    .body(body)
                    .retrieve()
                    .body(String.class);

            Map<String, Object> summary = new LinkedHashMap<>();
            summary.put("url", url);
            summary.put("method", method.name());
            summary.put("response", response);

            return summary;

        } catch (Exception e) {
            log.error("HTTP tool execution failed", e);
            throw new RuntimeException(e);
        }
    }

    @Override
    public String getType() {
        return "http_tool";
    }

    private Map<String, Object> extractPayload(Object payloadObj) throws Exception {

        if (payloadObj instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }

        if (payloadObj instanceof String json) {
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {
            });
        }

        return Map.of();
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> asMap(Object value) {
        return value instanceof Map<?, ?> map
                ? (Map<String, Object>) map
                : Map.of();
    }
}