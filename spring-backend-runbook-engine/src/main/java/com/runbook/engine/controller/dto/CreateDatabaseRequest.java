package com.runbook.engine.controller.dto;

import com.runbook.engine.domain.DatabaseType;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
@Getter
@Setter
public class CreateDatabaseRequest {

    private String name;
    private DatabaseType type;

    // SQL
    private String host;
    private String port;
    private String database;
    private String username;
    private String password;

    // SAP
    private String baseUrl;
    private String client;
    private String systemId;
    private String sapUsername;
    private String sapPassword;
}

