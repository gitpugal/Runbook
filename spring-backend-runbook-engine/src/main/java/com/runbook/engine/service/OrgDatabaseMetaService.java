package com.runbook.engine.service;

import com.runbook.engine.controller.dto.TableColumnDTO;
import com.runbook.engine.controller.dto.TableSchemaDTO;
import com.runbook.engine.domain.OrgDatabase;
import com.runbook.engine.repository.OrgDatabaseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.Types;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrgDatabaseMetaService {

    private final OrgDatabaseRepository dbRepo;
    private final OrgDbConnectionFactory connectionFactory;

    public List<String> listTables(UUID dbId) throws Exception {
        OrgDatabase db = dbRepo.findById(dbId)
                .orElseThrow(() -> new RuntimeException("DB not found"));

        try (Connection conn = connectionFactory.connect(db)) {
            DatabaseMetaData meta = conn.getMetaData();
            ResultSet rs = meta.getTables(null, null, "%", new String[]{"TABLE"});

            List<String> tables = new ArrayList<>();
            while (rs.next()) {
                tables.add(rs.getString("TABLE_NAME"));
            }
            return tables;
        }
    }

    public TableSchemaDTO getTableSchema(UUID dbId, String tableName) throws Exception {
        OrgDatabase db = dbRepo.findById(dbId)
                .orElseThrow(() -> new RuntimeException("DB not found"));

        try (Connection conn = connectionFactory.connect(db)) {
            DatabaseMetaData meta = conn.getMetaData();

            // Get Primary Key
            ResultSet pkRs = meta.getPrimaryKeys(null, null, tableName);
            String primaryKey = null;
            if (pkRs.next()) {
                primaryKey = pkRs.getString("COLUMN_NAME");
            }

            // Get Columns
            ResultSet colRs = meta.getColumns(null, null, tableName, null);
            List<TableColumnDTO> columns = new ArrayList<>();

            while (colRs.next()) {
                String colName = colRs.getString("COLUMN_NAME");
                int sqlType = colRs.getInt("DATA_TYPE");

                String type = mapSqlType(sqlType);
                List<String> operators = allowedOperators(type);

                columns.add(new TableColumnDTO(colName, type, operators, true));
            }

            return new TableSchemaDTO(tableName, primaryKey, columns);
        }
    }

    /* ---------- helpers ---------- */

    private String mapSqlType(int sqlType) {
        return switch (sqlType) {
            case Types.INTEGER, Types.DECIMAL, Types.FLOAT, Types.DOUBLE -> "number";
            case Types.DATE, Types.TIMESTAMP -> "date";
            case Types.BOOLEAN, Types.BIT -> "boolean";
            default -> "string";
        };
    }

    private List<String> allowedOperators(String type) {
        return switch (type) {
            case "number", "date" -> List.of("=", "!=", ">", "<", ">=", "<=");
            case "boolean" -> List.of("=");
            default -> List.of("=", "!=", "IN");
        };
    }
}
