package com.runbook.engine.execution.datapacket;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Pattern;

@Repository
@RequiredArgsConstructor
@Slf4j
public class JdbcDataPacketRepository implements DataPacketRepository {

    private static final Pattern SQL_IDENTIFIER =
            Pattern.compile("[A-Za-z_][A-Za-z0-9_]*");

    private static final Set<String> ALLOWED_OPERATORS = Set.of(
            "=",
            "!=",
            "<>",
            ">",
            ">=",
            "<",
            "<=",
            "LIKE",
            "ILIKE"
    );

    private final JdbcTemplate jdbcTemplate;

    @Override
    public Map<String, Object> load(
            String schema,
            String table,
            Map<String, Object> businessKeys
    ) {
        String safeSchema = requireIdentifier(schema, "schema");
        String safeTable = requireIdentifier(table, "table");

        StringBuilder sql = new StringBuilder(
                "SELECT * FROM " + safeSchema + "." + safeTable
        );

        List<Object> params = new ArrayList<>();

        if (!businessKeys.isEmpty()) {
            sql.append(" WHERE ");

            int i = 0;
            for (Map.Entry<String, Object> entry : businessKeys.entrySet()) {
                sql.append(requireIdentifier(entry.getKey(), "business key column")).append(" = ?");
                params.add(entry.getValue());

                if (i++ < businessKeys.size() - 1) {
                    sql.append(" AND ");
                }
            }
        }

        return jdbcTemplate.queryForMap(sql.toString(), params.toArray());
    }

    @Override
    public void update(
            String schema,
            String table,
            Map<String, Object> businessKeys,
            Map<String, Object> data,
            Set<String> dirtyFields
    ) {
        String safeSchema = requireIdentifier(schema, "schema");
        String safeTable = requireIdentifier(table, "table");

        if (dirtyFields.isEmpty()) return;

        StringBuilder sql = new StringBuilder();
        List<Object> params = new ArrayList<>();

        sql.append("UPDATE ")
                .append(safeSchema)
                .append(".")
                .append(safeTable)
                .append(" SET ");

        int i = 0;
        for (String field : dirtyFields) {

            sql.append(requireIdentifier(field, "update column")).append(" = ?");
            params.add(normalizeValue(data.get(field)));

            if (i++ < dirtyFields.size() - 1) {
                sql.append(", ");
            }
        }
        if (!businessKeys.isEmpty())
            sql.append(" WHERE ");

        int j = 0;
        for (Map.Entry<String, Object> entry : businessKeys.entrySet()) {

            sql.append(requireIdentifier(entry.getKey(), "business key column")).append(" = ?");
            params.add(entry.getValue());

            if (j++ < businessKeys.size() - 1) {
                sql.append(" AND ");
            }
        }
        log.debug("Executing SQL: {}", sql);
        log.debug("With params: {}", params);
        jdbcTemplate.update(sql.toString(), params.toArray());
    }

    @Override
    public void delete(
            String schema,
            String table,
            Map<String, Object> businessKeys
    ) {
        String safeSchema = requireIdentifier(schema, "schema");
        String safeTable = requireIdentifier(table, "table");

        StringBuilder sql = new StringBuilder(
                "DELETE FROM " + safeSchema + "." + safeTable + " WHERE "
        );

        List<Object> params = new ArrayList<>();

        int i = 0;
        for (Map.Entry<String, Object> entry : businessKeys.entrySet()) {

            sql.append(requireIdentifier(entry.getKey(), "business key column")).append(" = ?");
            params.add(entry.getValue());

            if (i++ < businessKeys.size() - 1) {
                sql.append(" AND ");
            }
        }

        jdbcTemplate.update(sql.toString(), params.toArray());
    }

    /* ---------------- Query Support ---------------- */

    public List<Map<String, Object>> query(DataQuery query) {
        String safeSchema = requireIdentifier(query.getSchema(), "schema");
        String safeTable = requireIdentifier(query.getTable(), "table");

        StringBuilder sql = new StringBuilder(
                "SELECT * FROM " + safeSchema + "." + safeTable
        );

        List<Object> params = new ArrayList<>();

        if (query.getFilters() != null && !query.getFilters().isEmpty()) {

            sql.append(" WHERE ");

            for (int i = 0; i < query.getFilters().size(); i++) {

                FilterCondition f = query.getFilters().get(i);

                sql.append(requireIdentifier(f.getColumn(), "filter column"))
                        .append(" ")
                        .append(requireOperator(f.getOperator()))
                        .append(" ?");

                params.add(f.getValue());

                if (i < query.getFilters().size() - 1) {
                    sql.append(" AND ");
                }
            }
        }

        return jdbcTemplate.queryForList(sql.toString(), params.toArray());
    }

    private String requireIdentifier(String value, String label) {
        if (value == null || !SQL_IDENTIFIER.matcher(value).matches()) {
            throw new IllegalArgumentException("Invalid " + label + ": " + value);
        }
        return value;
    }

    private String requireOperator(String operator) {
        if (operator == null) {
            throw new IllegalArgumentException("Invalid filter operator: null");
        }
        String normalized = operator.trim().toUpperCase(Locale.ROOT);
        if (!ALLOWED_OPERATORS.contains(normalized)) {
            throw new IllegalArgumentException("Unsupported filter operator: " + operator);
        }
        return normalized;
    }

    private Object normalizeValue(Object value) {

        if (value == null) return null;

        if (!(value instanceof String str)) {
            return value;
        }

        str = str.trim();

        // Boolean
        if (str.equalsIgnoreCase("true") || str.equalsIgnoreCase("false")) {
            return Boolean.parseBoolean(str);
        }

        // Integer
        try {
            return Integer.valueOf(str);
        } catch (Exception ignored) {
        }

        // Long
        try {
            return Long.valueOf(str);
        } catch (Exception ignored) {
        }

        // UUID
        try {
            return UUID.fromString(str);
        } catch (Exception ignored) {
        }

        // ISO OffsetDateTime (best format)
        try {
            return OffsetDateTime.parse(str);
        } catch (Exception ignored) {
        }

        // dd-MM-yyyy
        try {
            DateTimeFormatter formatter =
                    DateTimeFormatter.ofPattern("dd-MM-yyyy");

            LocalDate date = LocalDate.parse(str, formatter);

            return date.atStartOfDay().atOffset(ZoneOffset.UTC);

        } catch (Exception ignored) {
        }

        return str;
    }
}
