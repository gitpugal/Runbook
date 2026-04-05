package com.runbook.engine.repository;

import com.runbook.engine.domain.EntityDefinition;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EntityDefinitionRepository extends JpaRepository<EntityDefinition, UUID> {
    List<EntityDefinition> findByEnvironment_Organization_IdOrderByDisplayNameAsc(UUID organizationId);
    Optional<EntityDefinition> findByIdAndEnvironment_Organization_Id(UUID id, UUID organizationId);
    Optional<EntityDefinition> findByEnvironment_Organization_IdAndTableName(UUID organizationId, String tableName);
    boolean existsByEnvironment_IdAndTableNameIgnoreCase(UUID environmentId, String tableName);

    List<EntityDefinition> findByEnvironment_Organization_IdAndEnvironment_IdOrderByDisplayNameAsc(UUID organizationId, UUID envId);
}
