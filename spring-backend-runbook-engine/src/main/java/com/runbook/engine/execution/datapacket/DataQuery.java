package com.runbook.engine.execution.datapacket;

import lombok.Getter;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Getter
public class DataQuery {

    private final String schema;
    private final String table;
    private final List<FilterCondition> filters = new ArrayList<>();
    private final Map<String, Object> businessKeys;

    public DataQuery(String schema, String table, Map<String, Object> businessKeys) {
        this.schema = Objects.requireNonNull(schema, "schema must not be null");
        this.table = Objects.requireNonNull(table, "table must not be null");
        this.businessKeys = businessKeys == null ? Collections.emptyMap() : businessKeys;
    }

    public DataQuery addFilter(String column, String operator, Object value) {
        filters.add(new FilterCondition(column, operator, value));
        return this;
    }
}
