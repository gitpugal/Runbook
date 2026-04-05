package com.runbook.engine.execution;

import com.runbook.engine.execution.graph.WorkflowGraph;
import com.runbook.engine.execution.graph.WorkflowNode;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.util.Map;

public class WorkflowParser {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final String NODES = "nodes";
    private static final String EDGES = "edges";
    private static final String DATA = "data";
    private static final String TYPE = "type";
    private static final String CONFIG = "config";
    private static final String ID = "id";
    private static final String SOURCE = "source";
    private static final String TARGET = "target";
    private static final String SOURCE_HANDLE = "sourceHandle";

    public static WorkflowGraph parse(String json) {

        try {
            JsonNode root = MAPPER.readTree(json);

            WorkflowGraph graph = new WorkflowGraph();

            // Nodes
            JsonNode nodes = require(root, NODES);
            for (JsonNode nodeJson : nodes) {

                WorkflowNode node = new WorkflowNode();
                node.setId(require(nodeJson, ID).asText());

                JsonNode dataNode = require(nodeJson, DATA);
                node.setType(require(dataNode, TYPE).asText());

                node.setConfig(
                        MAPPER.convertValue(
                                dataNode.path(CONFIG),
                                Map.class
                        )
                );

                graph.addNode(node);
            }

            // Edges
            JsonNode edges = require(root, EDGES);
            for (JsonNode edge : edges) {

                String source = require(edge, SOURCE).asText();
                String target = require(edge, TARGET).asText();

                JsonNode handle = edge.path(SOURCE_HANDLE);
                String branch = handle.isMissingNode() || handle.isNull()
                        ? null
                        : handle.asText();

                graph.addEdge(source, branch, target);
            }

            return graph;

        } catch (Exception e) {
            throw new RuntimeException("Failed to parse workflow", e);
        }
    }

    private static JsonNode require(JsonNode node, String fieldName) {
        JsonNode value = node.path(fieldName);
        if (value.isMissingNode() || value.isNull()) {
            throw new IllegalArgumentException("Missing required field: " + fieldName);
        }
        return value;
    }
}
