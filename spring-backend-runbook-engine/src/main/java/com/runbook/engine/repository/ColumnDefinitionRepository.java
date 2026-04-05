package com.runbook.engine.repository;

import com.runbook.engine.domain.ColumnDefinition;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ColumnDefinitionRepository extends JpaRepository<ColumnDefinition, UUID> {
    List<ColumnDefinition> findByEntity_IdOrderByCreatedAtAsc(UUID entityId);
    Optional<ColumnDefinition> findByEntity_IdAndColumnName(UUID entityId, String columnName);
    boolean existsByEntity_IdAndColumnNameIgnoreCase(UUID entityId, String columnName);
}
