package com.runbook.engine.execution.executors.tools;

import com.runbook.engine.execution.ExecutionContext;
import com.runbook.engine.execution.graph.WorkflowNode;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

import java.util.LinkedHashMap;
import java.util.Map;

@Component("kafka_tool")
@RequiredArgsConstructor
public class KafkaTool implements ToolExecutor {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    @Override
    public Object execute(WorkflowNode node, ExecutionContext context) {
        Map<String, Object> config = node.getConfigOrEmpty();
        String topic = String.valueOf(config.get("topic"));
        Object message = config.getOrDefault("message", Map.of());
        try {
            kafkaTemplate.send(topic, objectMapper.writeValueAsString(message));
        } catch (Exception exception) {
            throw new IllegalStateException("Failed to publish Kafka message", exception);
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("topic", topic);
        summary.put("message", message);
        return summary;
    }

    @Override
    public String getType() {
        return "kafka_tool";
    }
}
