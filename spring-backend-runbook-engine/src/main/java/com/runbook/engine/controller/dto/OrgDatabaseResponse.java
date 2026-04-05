package com.runbook.engine.controller.dto;

import com.runbook.engine.domain.DatabaseType;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Data
@AllArgsConstructor
@Setter
@Getter
@Builder
public class OrgDatabaseResponse {
    private UUID id;
    private String name;
    private Instant createdAt;
    private DatabaseType type;
    private String host;
    private Integer port;
    private String sapBaseUrl;
}
