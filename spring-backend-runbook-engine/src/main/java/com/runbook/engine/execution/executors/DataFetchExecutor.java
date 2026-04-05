package com.runbook.engine.execution.executors;

import com.runbook.engine.execution.ExecutionContext;
import com.runbook.engine.execution.NodeExecutionResult;
import com.runbook.engine.execution.datapacket.DataPacket;
import com.runbook.engine.execution.datapacket.DataPacketFactory;
import com.runbook.engine.execution.datapacket.DataQuery;
import com.runbook.engine.execution.graph.WorkflowNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataFetchExecutor implements NodeExecutor {

    private final DataPacketFactory dataPacketFactory;

    @Override
    public String getType() {
        return "DATA_FETCH";
    }

    @Override
    @SuppressWarnings("unchecked")
    public NodeExecutionResult execute(
            WorkflowNode node,
            ExecutionContext context
    ) {

        log.debug("==> DATA_FETCH EXECUTOR STARTED");

        Map<String, Object> config = node.getConfigOrEmpty();

        String schema = (String) config.getOrDefault("schema", "public");
        String table = (String) config.get("table");

        if (table == null) {
            throw new IllegalStateException("Table not configured for DATA_FETCH node");
        }

        List<Map<String, Object>> filters =
                (List<Map<String, Object>>) config.getOrDefault("filters", new ArrayList<>());

        // Build query
        DataQuery query = new DataQuery(schema, table, Map.of());

        for (Map<String, Object> filter : filters) {

            String column = filter.get("column").toString();
            String operator = filter.get("operator").toString();
            Object value = filter.get("value");

            query.addFilter(column, operator, value);
        }

        // Execute query
        List<DataPacket> packets = dataPacketFactory.query(query);

        log.debug("Fetched {} rows from {}.{}", packets.size(), schema, table);

        // Store in execution context (overwrite current context data)
        context.store(node.getId(), packets);

        return NodeExecutionResult.success();
    }
}
