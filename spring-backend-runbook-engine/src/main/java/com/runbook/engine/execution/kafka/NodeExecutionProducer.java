package com.runbook.engine.execution.kafka;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class NodeExecutionProducer {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public void publish(String nodeType, NodeExecutionTask task) {
        String topic = NodeExecutionTopics.forNodeType(nodeType);
        UUID executionId = task.getExecutionId();
        String key = executionId == null ? null : executionId.toString();
        try {
            String payload = objectMapper.writeValueAsString(task);
            kafkaTemplate.send(topic, key, payload);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to serialize node execution task", e);
        }
        log.debug("Published node task. topic={}, executionId={}, nodeId={}",
                topic, task.getExecutionId(), task.getNodeId());
    }
}
