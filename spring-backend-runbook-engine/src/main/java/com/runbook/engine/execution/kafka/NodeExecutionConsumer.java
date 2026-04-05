package com.runbook.engine.execution.kafka;

import com.runbook.engine.execution.executors.WorkflowExecutionEngine;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

@Component
@RequiredArgsConstructor
@Slf4j
public class NodeExecutionConsumer {

    private final WorkflowExecutionEngine workflowExecutionEngine;
    private final ObjectMapper objectMapper;

    @KafkaListener(topics = NodeExecutionTopics.DATA_TRIGGER_TOPIC)
    public void consumeDataTrigger(String payload) {
        process(payload);
    }

    @KafkaListener(topics = NodeExecutionTopics.DATA_FETCH_TOPIC)
    public void consumeDataFetch(String payload) {
        process(payload);
    }

    @KafkaListener(topics = NodeExecutionTopics.CONDITION_TOPIC)
    public void consumeCondition(String payload) {
        process(payload);
    }

    @KafkaListener(topics = NodeExecutionTopics.DATA_UPDATE_TOPIC)
    public void consumeDataUpdate(String payload) {
        process(payload);
    }

    @KafkaListener(topics = NodeExecutionTopics.TOOL_TRIGGER_TOPIC)
    public void consumeToolTrigger(String payload) {
        process(payload);
    }

    @KafkaListener(topics = NodeExecutionTopics.JOIN_TOPIC)
    public void consumeJoin(String payload) {
        process(payload);
    }

    @KafkaListener(topics = NodeExecutionTopics.LOOP_TOPIC)
    public void consumeLoop(String payload) {
        process(payload);
    }

    @KafkaListener(topics = NodeExecutionTopics.WEBHOOK_TRIGGER_TOPIC)
    public void consumeWebhookTrigger(String payload) {
        process(payload);
    }

    private void process(String payload) {
        try {
            NodeExecutionTask task = objectMapper.readValue(payload, NodeExecutionTask.class);

            workflowExecutionEngine.processNodeTask(task);
        } catch (Exception e) {
            log.error("Failed to deserialize node execution task payload", e);
        }
    }
}
