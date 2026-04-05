package com.runbook.engine.execution.datapacket;

import lombok.Getter;

import java.util.HashMap;
import java.util.Map;

@Getter
public class DataKey {

    private final String schema;
    private final String table;
    private final Map<String, Object> businessKeys = new HashMap<>();

    public DataKey(String schema, String table) {
        this.schema = schema;
        this.table = table;
    }

    public DataKey setKeyValue(String column, Object value) {
        businessKeys.put(column, value);
        return this;
    }
}