package com.runbook.engine.service;

import com.runbook.engine.controller.dto.ConnectionTestResponse;
import com.runbook.engine.controller.dto.TestConnectionRequest;
import com.runbook.engine.controller.dto.TestConnectionResponse;
import com.runbook.engine.controller.dto.TestDatabaseConnectionRequest;
import org.springframework.stereotype.Service;

import java.sql.Connection;
import java.sql.DriverManager;

@Service
public class SqlConnectionTester {

    public TestConnectionResponse test(TestConnectionRequest req) {
        try {
            String url = buildJdbcUrl(req);
            try (Connection conn = DriverManager.getConnection(url, req.getUsername(), req.getPassword())) {
                return new TestConnectionResponse(true, "Connection successful");
            }
        } catch (Exception e) {
            return new TestConnectionResponse(false, e.getMessage());
        }
    }

    private String buildJdbcUrl(TestConnectionRequest req) {
        return switch (req.getType()) {
            case POSTGRES -> "jdbc:postgresql://" + req.getHost() + ":" + req.getPort() + "/" + req.getDatabase();
            case MYSQL -> "jdbc:mysql://" + req.getHost() + ":" + req.getPort() + "/" + req.getDatabase();
            case MSSQL ->
                    "jdbc:sqlserver://" + req.getHost() + ":" + req.getPort() + ";databaseName=" + req.getDatabase();
            default -> "";
        };
    }
}
