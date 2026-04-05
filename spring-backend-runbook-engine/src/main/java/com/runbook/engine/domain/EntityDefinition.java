package com.runbook.engine.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "entity_definitions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EntityDefinition {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "environment_id", nullable = false)
    private OrganizationEnvironment environment;


    @Column(name = "table_name", nullable = false)
    private String tableName;

    @Column(name = "display_name", nullable = false)
    private String displayName;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;
}
