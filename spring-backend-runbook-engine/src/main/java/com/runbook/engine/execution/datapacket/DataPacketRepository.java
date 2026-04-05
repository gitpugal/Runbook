package com.runbook.engine.execution.datapacket;

import java.util.Map;
import java.util.Set;

public interface DataPacketRepository {

    Map<String, Object> load(
            String schema,
            String table,
            Map<String, Object> businessKeys
    );

    void update(
            String schema,
            String table,
            Map<String, Object> businessKeys,
            Map<String, Object> data,
            Set<String> dirtyFields
    );

    void delete(
            String schema,
            String table,
            Map<String, Object> businessKeys
    );
}