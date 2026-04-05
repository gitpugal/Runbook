package com.runbook.engine.repository;

import com.runbook.engine.domain.RelationshipDefinition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface RelationshipDefinitionRepository extends JpaRepository<RelationshipDefinition, UUID> {

    @Query("""
            SELECT relationship
            FROM RelationshipDefinition relationship
            WHERE (relationship.sourceEntity.environment.organization.id = :organizationId
               OR relationship.targetEntity.environment.organization.id = :organizationId)
               AND relationship.sourceEntity.environment.id = :envId
               OR relationship.targetEntity.environment.id = :envId
            ORDER BY relationship.sourceEntity.displayName ASC, relationship.targetEntity.displayName ASC
            """)
    List<RelationshipDefinition> findAllForOrganization(UUID organizationId, UUID envId);
}
