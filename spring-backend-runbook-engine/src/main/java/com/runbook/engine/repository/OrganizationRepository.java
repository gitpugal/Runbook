package com.runbook.engine.repository;

import com.runbook.engine.controller.dto.OrganizationWithUserRole;
import com.runbook.engine.domain.Organization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;


public interface OrganizationRepository extends JpaRepository<Organization, UUID> {
    @Query("""
SELECT new com.runbook.engine.controller.dto.OrganizationWithUserRole(
       m.organization.id,
       m.organization.name,
       m.role)
FROM OrganizationMember m
JOIN m.user u
WHERE u.email = :email
""")
    List<OrganizationWithUserRole> findOrganizationsByUserEmail(String email);


}
