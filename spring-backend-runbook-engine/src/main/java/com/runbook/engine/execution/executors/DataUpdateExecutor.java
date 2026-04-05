package com.runbook.engine.execution.executors;

import com.runbook.engine.execution.ExecutionContext;
import com.runbook.engine.execution.NodeExecutionResult;
import com.runbook.engine.execution.datapacket.DataPacket;
import com.runbook.engine.execution.graph.WorkflowNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Component
public class DataUpdateExecutor implements NodeExecutor {

    @Override
    public String getType() {
        return "DATA_UPDATE";
    }

    @Override
    @SuppressWarnings("unchecked")
    public NodeExecutionResult execute(
            WorkflowNode node,
            ExecutionContext context
    ) {

        log.debug("==> DATA UPDATE EXECUTION STARTED");

        List<DataPacket> packets = context.get();

        if (packets == null || packets.isEmpty()) {
            log.debug("No packets to update.");
            return NodeExecutionResult.success();
        }

        Map<String, Object> config = node.getConfigOrEmpty();
        List<Map<String, Object>> updates =
                (List<Map<String, Object>>) config.get("updates");

        if (updates == null || updates.isEmpty()) {
            log.debug("No update fields provided.");
            return NodeExecutionResult.success();
        }

        List<DataPacket> updatedPackets = new ArrayList<>();

        for (DataPacket packet : packets) {

            try {

                for (Map<String, Object> update : updates) {

                    String column = update.get("column").toString();
                    Object rawValue = update.get("value");

                    Object convertedValue =
                            convertToCorrectType(packet.get(column), rawValue);

                    packet.set(column, convertedValue);
                }

                packet.save();
                updatedPackets.add(packet);

            } catch (Exception e) {

                log.error("Failed updating packet {}",
                        packet, e);

                throw new RuntimeException(
                        "Data update failed for packet", e
                );
            }
        }

        context.store(node.getId(), updatedPackets);

        log.debug("Updated {} rows successfully", updatedPackets.size());

        return NodeExecutionResult.success();
    }

    /**
     * Convert frontend string value into correct DB type
     */
    private Object convertToCorrectType(
            Object existingValue,
            Object newValue
    ) {

        if (newValue == null) return null;

        String value = newValue.toString().trim();

        if (existingValue == null) {
            return value;
        }

        // Boolean
        if (existingValue instanceof Boolean) {
            return Boolean.parseBoolean(value);
        }

        // UUID
        if (existingValue instanceof UUID) {
            return UUID.fromString(value);
        }

        // Integer / Long
        if (existingValue instanceof Integer) {
            return Integer.parseInt(value);
        }

        if (existingValue instanceof Long) {
            return Long.parseLong(value);
        }

        if (existingValue instanceof Double) {
            return Double.parseDouble(value);
        }

        // LocalDateTime
        if (existingValue instanceof LocalDateTime) {

            // Accept multiple date formats
            List<DateTimeFormatter> formats = List.of(
                    DateTimeFormatter.ofPattern("dd-MM-yyyy"),
                    DateTimeFormatter.ISO_LOCAL_DATE_TIME
            );

            for (DateTimeFormatter formatter : formats) {
                try {
                    if (formatter.toString().contains("yyyy-MM-dd")) {
                        return LocalDateTime.parse(value, formatter);
                    } else {
                        LocalDate date = LocalDate.parse(value, formatter);
                        return date.atStartOfDay();
                    }
                } catch (Exception ignored) {
                }
            }

            throw new RuntimeException("Invalid date format: " + value);
        }

        // String fallback
        return value;
    }
}
