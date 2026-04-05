package com.runbook.engine.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
@Table(name = "column_definitions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ColumnDefinition {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "entity_id", nullable = false)
    private EntityDefinition entity;

    @Column(name = "column_name", nullable = false)
    private String columnName;

    @Column(name = "display_name", nullable = false)
    private String displayName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ColumnType type;

    @Column(nullable = false)
    private boolean required;

    @Column(name = "is_unique", nullable = false)
    private boolean uniqueColumn;

    @Column(name = "default_value")
    private String defaultValue;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;
}
