package com.runbook.engine.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
        name = "organization_environments",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = "schema_name")
        }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrganizationEnvironment {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @Column(name = "schema_name", nullable = false)
    private String schemaName;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column
    private String name;
}
