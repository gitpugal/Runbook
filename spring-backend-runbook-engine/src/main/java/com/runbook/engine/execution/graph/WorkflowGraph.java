package com.runbook.engine.execution.graph;

import java.util.*;

public class WorkflowGraph {

    public static final String DEFAULT_BRANCH = "default";
    private static final Set<String> TRIGGER_NODE_TYPES = Set.of("DATA_TRIGGER", "WEBHOOK_TRIGGER");

    private final Map<String, WorkflowNode> nodes = new HashMap<>();
    private final Map<String, List<WorkflowEdge>> outgoing = new HashMap<>();
    private final Map<String, List<WorkflowEdge>> incoming = new HashMap<>();

    public void addNode(WorkflowNode node) {
        Objects.requireNonNull(node, "node must not be null");
        Objects.requireNonNull(node.getId(), "node.id must not be null");
        nodes.put(node.getId(), node);
    }

    public void addEdge(String source, String branch, String target) {
        Objects.requireNonNull(source, "source must not be null");
        Objects.requireNonNull(target, "target must not be null");
        WorkflowEdge edge = new WorkflowEdge(source, branch == null ? DEFAULT_BRANCH : branch, target);
        outgoing.computeIfAbsent(source, ignored -> new ArrayList<>()).add(edge);
        incoming.computeIfAbsent(target, ignored -> new ArrayList<>()).add(edge);
    }

    public WorkflowNode getNode(String id) {
        return nodes.get(id);
    }

    public List<String> getNextNodes(String nodeId, String branch) {
        List<WorkflowEdge> edges = outgoing.getOrDefault(nodeId, List.of());
        if (edges.isEmpty()) {
            return List.of();
        }

        String desiredBranch = branch == null ? DEFAULT_BRANCH : branch;
        List<String> exactMatches = edges.stream()
                .filter(edge -> desiredBranch.equals(edge.branch()))
                .map(WorkflowEdge::target)
                .toList();

        if (!exactMatches.isEmpty()) {
            return exactMatches;
        }

        if (!DEFAULT_BRANCH.equals(desiredBranch)) {
            return edges.stream()
                    .filter(edge -> DEFAULT_BRANCH.equals(edge.branch()))
                    .map(WorkflowEdge::target)
                    .toList();
        }

        return List.of();
    }

    public List<String> getParents(String nodeId) {
        return incoming.getOrDefault(nodeId, List.of()).stream()
                .map(WorkflowEdge::source)
                .distinct()
                .toList();
    }

    public int getIncomingCount(String nodeId) {
        return (int) incoming.getOrDefault(nodeId, List.of()).stream()
                .map(WorkflowEdge::source)
                .distinct()
                .count();
    }

    public List<String> findRootNodes() {
        return nodes.keySet().stream()
                .filter(nodeId -> !incoming.containsKey(nodeId))
                .sorted()
                .toList();
    }

    public List<String> findTriggerNodes() {
        return nodes.values().stream()
                .filter(node -> TRIGGER_NODE_TYPES.contains(node.getType()))
                .map(WorkflowNode::getId)
                .sorted()
                .toList();
    }

    public String findTriggerNode() {
        return findTriggerNodes().stream()
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("No trigger node found"));
    }

    public String findFirstNode() {
        return findRootNodes().stream()
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Workflow has no starting node"));
    }

    public record WorkflowEdge(String source, String branch, String target) {
    }
}
