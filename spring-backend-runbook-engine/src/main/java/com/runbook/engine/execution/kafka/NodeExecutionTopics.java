package com.runbook.engine.execution.kafka;

import java.util.Map;

public final class NodeExecutionTopics {

    public static final String DATA_TRIGGER_TOPIC = "workflow.node.data-trigger";
    public static final String DATA_FETCH_TOPIC = "workflow.node.data-fetch";
    public static final String CONDITION_TOPIC = "workflow.node.condition";
    public static final String DATA_UPDATE_TOPIC = "workflow.node.data-update";
    public static final String TOOL_TRIGGER_TOPIC = "workflow.node.tool-trigger";
    public static final String JOIN_TOPIC = "workflow.node.join";
    public static final String LOOP_TOPIC = "workflow.node.loop";
    public static final String WEBHOOK_TRIGGER_TOPIC = "workflow.node.webhook-trigger";

    private static final Map<String, String> NODE_TYPE_TO_TOPIC = Map.of(
            "DATA_TRIGGER", DATA_TRIGGER_TOPIC,
            "DATA_FETCH", DATA_FETCH_TOPIC,
            "CONDITION", CONDITION_TOPIC,
            "DATA_UPDATE", DATA_UPDATE_TOPIC,
            "TOOL_TRIGGER", TOOL_TRIGGER_TOPIC,
            "JOIN", JOIN_TOPIC,
            "LOOP", LOOP_TOPIC,
            "WEBHOOK_TRIGGER", WEBHOOK_TRIGGER_TOPIC
    );

    private NodeExecutionTopics() {
    }

    public static String forNodeType(String nodeType) {
        String topic = NODE_TYPE_TO_TOPIC.get(nodeType);
        if (topic == null) {
            throw new IllegalArgumentException("Unsupported node type for Kafka dispatch: " + nodeType);
        }
        return topic;
    }
}
