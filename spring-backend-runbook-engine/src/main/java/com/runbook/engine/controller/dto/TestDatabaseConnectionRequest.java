package com.runbook.engine.controller.dto;

import com.runbook.engine.domain.DatabaseType;
import lombok.Data;

@Data
public class TestDatabaseConnectionRequest {
    private DatabaseType type;
    private String host;
    private Integer port;
    private String database;
    private String username;
    private String password;
}
