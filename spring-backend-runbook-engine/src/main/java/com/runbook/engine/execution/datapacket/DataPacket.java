package com.runbook.engine.execution.datapacket;

import lombok.Getter;

import java.util.*;

@Getter
public class DataPacket {

    private final String schema;
    private final String table;

    private final Map<String, Object> values = new HashMap<>();
    private final Map<String, Object> businessKeys = new HashMap<>();
    private final Set<String> dirtyFields = new HashSet<>();

    private DataPacketRepository repository;

    public DataPacket(String schema, String table) {
        this.schema = Objects.requireNonNull(schema, "schema must not be null");
        this.table = Objects.requireNonNull(table, "table must not be null");
    }

    public void attachRepository(DataPacketRepository repository) {
        this.repository = Objects.requireNonNull(repository, "repository must not be null");
    }

    public void setBusinessKey(String column, Object value) {
        businessKeys.put(column, value);
    }

    public void set(String column, Object value) {
        values.put(column, value);
        dirtyFields.add(column);
    }

    public Object get(String column) {
        return values.get(column);
    }

    public void setAll(Map<String, Object> row) {
        values.putAll(row);
    }

    public void save() {
        if (repository == null) {
            throw new IllegalStateException("Repository not attached");
        }

        if (businessKeys.isEmpty()) {
            throw new IllegalStateException("Business keys missing. Unsafe update prevented.");
        }

        repository.update(
                schema,
                table,
                businessKeys,
                values,
                dirtyFields
        );

        dirtyFields.clear();
    }

    public Map<String, Object> toMap() {
        return new LinkedHashMap<>(values);
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append("\nDataPacket\n");
        sb.append("Schema: ").append(schema).append("\n");
        sb.append("Table: ").append(table).append("\n");
        sb.append("--------------------------------\n");

        values.forEach((k, v) ->
                sb.append(k).append(" - ").append(v).append("\n")
        );

        return sb.toString();
    }
}
