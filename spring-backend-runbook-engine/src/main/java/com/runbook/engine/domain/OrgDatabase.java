package com.runbook.engine.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "org_databases")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrgDatabase {

    @Id
    private UUID id;

    private String name;

    @Enumerated(EnumType.STRING)
    private DatabaseType type;

    /* =========================================================
       SQL DATABASE FIELDS (Postgres, MySQL, MSSQL)
       ========================================================= */
    private String host;
    private Integer port;
    private String databaseName;

    private String username;
    private String encryptedPassword;

    /* =========================================================
       SAP CONNECTION FIELDS
       ========================================================= */

    /**
     * Example:
     * https://my-sap-system.company.com/sap/opu/odata
     */
    private String sapBaseUrl;


    /* ========================================================= */

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    private Instant createdAt;
}
