package com.runbook.engine.execution;

import com.runbook.engine.execution.datapacket.DataPacket;
import tools.jackson.databind.ObjectMapper;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class ExecutionContext {

    public interface LogSink {
        void log(String level, String nodeId, String message);
    }

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final Pattern EXPRESSION_PATTERN = Pattern.compile("\\{\\{\\s*([^}]+?)\\s*}}");

    private List<DataPacket> currentPackets = new ArrayList<>();
    private final Map<String, List<DataPacket>> packetOutputs = new HashMap<>();
    private final Map<String, Object> nodeOutputs = new HashMap<>();
    private final Map<String, Object> variables = new HashMap<>();
    private final Map<String, String> errors = new HashMap<>();
    private final Set<String> completedNodes = new LinkedHashSet<>();
    private transient LogSink logSink;
    private transient String activeNodeId;

    public ExecutionContext() {
    }

    public ExecutionContext(ExecutionContext other) {
        this.currentPackets = copyPackets(other.currentPackets);
        other.packetOutputs.forEach((key, value) -> this.packetOutputs.put(key, copyPackets(value)));
        this.nodeOutputs.putAll(other.nodeOutputs);
        this.variables.putAll(other.variables);
        this.errors.putAll(other.errors);
        this.completedNodes.addAll(other.completedNodes);
        this.logSink = other.logSink;
        this.activeNodeId = other.activeNodeId;
    }

    public void setLogSink(LogSink logSink) {
        this.logSink = logSink;
    }

    public void setActiveNodeId(String activeNodeId) {
        this.activeNodeId = activeNodeId;
    }

    public void clearActiveNodeId() {
        this.activeNodeId = null;
    }

    public void store(List<DataPacket> packets) {
        currentPackets = copyPackets(packets);
    }

    public void store(String key, List<DataPacket> packets) {
        List<DataPacket> safeCopy = copyPackets(packets);
        packetOutputs.put(key, safeCopy);
        nodeOutputs.put(key, snapshotPackets(safeCopy));
        currentPackets = safeCopy;
    }

    public void storeNodeOutput(String nodeId, Object output) {
        Object snapshotted = snapshotValue(output);
        nodeOutputs.put(nodeId, snapshotted);
        if (output instanceof List<?> list && isPacketList(list)) {
            @SuppressWarnings("unchecked")
            List<DataPacket> packets = (List<DataPacket>) list;
            packetOutputs.put(nodeId, copyPackets(packets));
            currentPackets = copyPackets(packets);
        }
    }

    public void putVariable(String key, Object value) {
        variables.put(key, snapshotValue(value));
    }

    public List<DataPacket> get() {
        return currentPackets;
    }

    public List<DataPacket> get(String key) {
        return packetOutputs.getOrDefault(key, List.of());
    }

    public List<DataPacket> getNodePackets(String nodeId) {
        return packetOutputs.getOrDefault(nodeId, List.of());
    }

    public Object getNodeOutput(String nodeId) {
        return nodeOutputs.get(nodeId);
    }

    public void markCompleted(String nodeId) {
        completedNodes.add(nodeId);
    }

    public void recordError(String nodeId, String message) {
        errors.put(nodeId, message);
        variables.put("lastError", Map.of("nodeId", nodeId, "message", message != null ? message : "Something went wrong."));
    }

    public Set<String> getCompletedNodes() {
        return Collections.unmodifiableSet(completedNodes);
    }

    public Map<String, Object> snapshot() {
        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("context", new LinkedHashMap<>(variables));
        snapshot.put("trigger", variables.getOrDefault("trigger", Map.of()));
        snapshot.put("current", snapshotPackets(currentPackets));
        snapshot.put("nodeOutputs", new LinkedHashMap<>(nodeOutputs));
        snapshot.put("completedNodes", new ArrayList<>(completedNodes));
        snapshot.put("errors", new LinkedHashMap<>(errors));
        return snapshot;
    }

    public Object resolveExpressions(Object value) {
        if (value == null) {
            return null;
        }

        if (value instanceof Map<?, ?> map) {
            Map<String, Object> resolved = new LinkedHashMap<>();
            map.forEach((key, entryValue) -> resolved.put(String.valueOf(key), resolveExpressions(entryValue)));
            return resolved;
        }

        if (value instanceof List<?> list) {
            List<Object> resolved = new ArrayList<>(list.size());
            for (Object entry : list) {
                resolved.add(resolveExpressions(entry));
            }
            return resolved;
        }

        if (!(value instanceof String raw)) {
            return value;
        }

        Matcher matcher = EXPRESSION_PATTERN.matcher(raw);
        if (!matcher.find()) {
            return raw;
        }

        matcher.reset();
        if (matcher.matches()) {
            return resolvePath(matcher.group(1));
        }

        StringBuffer buffer = new StringBuffer();
        while (matcher.find()) {
            Object resolved = resolvePath(matcher.group(1));
            matcher.appendReplacement(buffer, Matcher.quoteReplacement(resolved == null ? "" : String.valueOf(resolved)));
        }
        matcher.appendTail(buffer);
        return buffer.toString();
    }

    public ExecutionContext merge(ExecutionContext other) {
        ExecutionContext merged = new ExecutionContext(this);
        merged.currentPackets = new ArrayList<>(this.currentPackets);
        merged.currentPackets.addAll(copyPackets(other.currentPackets));
        other.packetOutputs.forEach((key, value) -> merged.packetOutputs.put(key, copyPackets(value)));
        merged.nodeOutputs.putAll(other.nodeOutputs);
        merged.variables.putAll(other.variables);
        merged.errors.putAll(other.errors);
        merged.completedNodes.addAll(other.completedNodes);
        return merged;
    }

    public void log(String level, String message) {
        if (logSink != null) {
            logSink.log(level, activeNodeId, message);
        }
    }

    public String toJson() {
        try {
            return OBJECT_MAPPER.writeValueAsString(snapshot());
        } catch (Exception e) {
            return "{}";
        }
    }

    private Object resolvePath(String path) {
        if (path == null || path.isBlank()) {
            return null;
        }

        String[] parts = path.split("\\.");
        Object current = switch (parts[0]) {
            case "context" -> variables;
            case "trigger" -> variables.getOrDefault("trigger", Map.of());
            case "current" -> snapshotPackets(currentPackets);
            case "nodeOutputs" -> nodeOutputs;
            default -> variables.containsKey(parts[0]) ? variables.get(parts[0]) : nodeOutputs.get(parts[0]);
        };

        for (int index = 1; index < parts.length; index++) {
            current = resolveSegment(current, parts[index]);
        }

        return current;
    }

    private Object resolveSegment(Object current, String segment) {
        if (current == null || segment == null || segment.isBlank()) {
            return null;
        }

        String normalized = segment;
        Integer index = null;
        if (segment.endsWith("]") && segment.contains("[")) {
            int bracketIndex = segment.indexOf('[');
            normalized = segment.substring(0, bracketIndex);
            index = Integer.parseInt(segment.substring(bracketIndex + 1, segment.length() - 1));
        }

        Object next = current;
        if (!normalized.isBlank()) {
            if (next instanceof Map<?, ?> map) {
                next = map.get(normalized);
            } else {
                return null;
            }
        }

        if (index != null) {
            if (next instanceof List<?> list && list.size() > index) {
                return list.get(index);
            }
            return null;
        }

        return next;
    }

    private static boolean isPacketList(List<?> list) {
        return list.stream().allMatch(DataPacket.class::isInstance);
    }

    private static List<DataPacket> copyPackets(List<DataPacket> packets) {
        return packets == null ? new ArrayList<>() : new ArrayList<>(packets);
    }

    private static Object snapshotValue(Object value) {
        if (value instanceof List<?> list && isPacketList(list)) {
            @SuppressWarnings("unchecked")
            List<DataPacket> packets = (List<DataPacket>) list;
            return snapshotPackets(packets);
        }
        return value;
    }

    private static List<Map<String, Object>> snapshotPackets(List<DataPacket> packets) {
        List<Map<String, Object>> snapshot = new ArrayList<>();
        if (packets == null) {
            return snapshot;
        }
        for (DataPacket packet : packets) {
            snapshot.add(packet.toMap());
        }
        return snapshot;
    }
}
