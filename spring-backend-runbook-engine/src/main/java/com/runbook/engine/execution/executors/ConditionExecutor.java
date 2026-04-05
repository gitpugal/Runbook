package com.runbook.engine.execution.executors;

import com.runbook.engine.execution.ExecutionContext;
import com.runbook.engine.execution.NodeExecutionResult;
import com.runbook.engine.execution.datapacket.DataPacket;
import com.runbook.engine.execution.graph.WorkflowNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class ConditionExecutor implements NodeExecutor {

    @Override
    public String getType() {
        return "CONDITION";
    }

    @Override
    public NodeExecutionResult execute(
            WorkflowNode node,
            ExecutionContext context
    ) {

        log.debug("==> CONDITION NODE RAN");

        List<DataPacket> inputPackets = context.get();

        if (inputPackets == null || inputPackets.isEmpty()) {
            log.debug("No input packets found");
            context.store(node.getId() + ":true", List.of());
            context.store(node.getId() + ":false", List.of());
            context.storeNodeOutput(node.getId(), Map.of("trueCount", 0, "falseCount", 0));
            return NodeExecutionResult.success();
        }

        Map<String, Object> config = node.getConfigOrEmpty();
        List<Map<String, Object>> filters =
                (List<Map<String, Object>>) config.getOrDefault("filters", Collections.emptyList());

        List<DataPacket> positiveList = new ArrayList<>();
        List<DataPacket> negativeList = new ArrayList<>();

        for (DataPacket packet : inputPackets) {
            boolean matches = evaluateFilters(packet, filters);
            if (matches) {
                positiveList.add(packet);
            } else {
                negativeList.add(packet);
            }
        }

        // Store branch-specific payloads with node-scoped keys
        context.store(node.getId() + ":true", positiveList);
        context.store(node.getId() + ":false", negativeList);
        context.storeNodeOutput(
                node.getId(),
                Map.of("trueCount", positiveList.size(), "falseCount", negativeList.size())
        );

        log.debug("Positive count: {}", positiveList.size());
        log.debug("Negative count: {}", negativeList.size());

        // Engine will explicitly fan-out to true/false paths
        return NodeExecutionResult.success();
    }


    private boolean evaluateFilters(
            DataPacket packet,
            List<Map<String, Object>> filters
    ) {

        for (Map<String, Object> filter : filters) {

            String column = filter.get("column").toString();
            String operator = filter.get("operator").toString();
            Object value = filter.get("value");

            Object packetValue = packet.get(column);

            log.debug("{} {} {} (actual={})",
                    column, operator, value, packetValue);

            if (!compare(packetValue, operator, value)) {
                return false;
            }
        }

        return true;
    }

    private boolean compare(
            Object packetValue,
            String operator,
            Object conditionValue
    ) {

        if (packetValue == null || conditionValue == null || operator == null) {
            return false;
        }

        Object left = normalize(packetValue);
        Object right = normalize(conditionValue);

        // If both numbers → compare as Double
        if (left instanceof Number && right instanceof Number) {
            double l = ((Number) left).doubleValue();
            double r = ((Number) right).doubleValue();
            return compareNumbers(l, r, operator);
        }

        // If both boolean
        if (left instanceof Boolean && right instanceof Boolean) {
            boolean l = (Boolean) left;
            boolean r = (Boolean) right;
            return compareBooleans(l, r, operator);
        }

        // Otherwise fallback to string comparison
        String l = left.toString();
        String r = right.toString();

        int cmp = l.compareTo(r);

        return switch (operator) {
            case "=" -> cmp == 0;
            case "!=" -> cmp != 0;
            case ">" -> cmp > 0;
            case "<" -> cmp < 0;
            case ">=" -> cmp >= 0;
            case "<=" -> cmp <= 0;
            default -> false;
        };
    }

    private Object normalize(Object value) {

        if (value instanceof Number || value instanceof Boolean) {
            return value;
        }

        String str = value.toString().trim();

        // Boolean detection
        if ("true".equalsIgnoreCase(str)) return true;
        if ("false".equalsIgnoreCase(str)) return false;

        // Number detection
        try {
            if (str.contains(".")) {
                return Double.parseDouble(str);
            }
            return Long.parseLong(str);
        } catch (NumberFormatException ignored) {
        }

        return str;
    }

    private boolean compareNumbers(double l, double r, String operator) {
        return switch (operator) {
            case "=" -> l == r;
            case "!=" -> l != r;
            case ">" -> l > r;
            case "<" -> l < r;
            case ">=" -> l >= r;
            case "<=" -> l <= r;
            default -> false;
        };
    }

    private boolean compareBooleans(boolean l, boolean r, String operator) {
        return switch (operator) {
            case "=" -> l == r;
            case "!=" -> l != r;
            default -> false; // other operators invalid for boolean
        };
    }
}
