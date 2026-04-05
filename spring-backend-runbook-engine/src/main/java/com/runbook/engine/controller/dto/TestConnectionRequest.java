package com.runbook.engine.controller.dto;

import com.runbook.engine.domain.DatabaseType;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TestConnectionRequest {
    private DatabaseType type;

    // SQL
    private String host;
    private String port;
    private String database;
    private String username;
    private String password;

    // SAP
    private String baseUrl;

}
