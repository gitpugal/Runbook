package com.runbook.engine.repository;

import com.runbook.engine.domain.DataDomain;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DataDomainRepository extends JpaRepository<DataDomain, UUID> {
    List<DataDomain> findByEnvironment_Organization_IdOrderByNameAsc(UUID organizationId);
    Optional<DataDomain> findByIdAndEnvironment_Organization_Id(UUID id, UUID organizationId);
}
