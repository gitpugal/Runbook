package com.runbook.engine.service;

import com.runbook.engine.controller.dto.CreateDatabaseRequest;
import com.runbook.engine.controller.dto.OrgDatabaseResponse;
import com.runbook.engine.domain.OrgDatabase;
import com.runbook.engine.domain.Organization;
import com.runbook.engine.repository.OrgDatabaseRepository;
import com.runbook.engine.repository.OrganizationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrgDatabaseService {

    private final OrgDatabaseRepository repo;
    private final OrganizationRepository orgRepo;

    public OrgDatabaseResponse create(UUID orgId, CreateDatabaseRequest req) {
        Organization org = orgRepo.findById(orgId).orElseThrow();
        OrgDatabase db = repo.save(
                OrgDatabase.builder()
                        .id(UUID.randomUUID())
                        .name(req.getName())
                        .type(req.getType())
                        .host(req.getHost())
                        .port(Integer.valueOf(req.getPort() != null ? req.getPort() : "0"))
                        .databaseName(req.getDatabase())
                        .username(req.getUsername())
                        .encryptedPassword(encrypt(req.getPassword()))
                        .organization(org)
                        .sapBaseUrl(req.getBaseUrl())
                        .createdAt(Instant.now())
                        .build()
        );
        return OrgDatabaseResponse.builder()
                .id(db.getId())
                .name(db.getName())
                .type(db.getType())
                .host(db.getHost())
                .port(db.getPort())
                .createdAt(db.getCreatedAt())
                .sapBaseUrl(db.getSapBaseUrl())
                .build();
    }

    public List<OrgDatabaseResponse> list(UUID orgId) {
        return repo.findByOrganization_Id(orgId).stream()
                .map(db -> new OrgDatabaseResponse(
                        db.getId(),
                        db.getName(),
                        db.getCreatedAt(),
                        db.getType(),
                        db.getHost(),
                        db.getPort(),
                        db.getSapBaseUrl()
                ))
                .toList();
    }

    public void delete(UUID dbId) {
        repo.deleteById(dbId);
    }

    private String encrypt(String raw) {
        return Base64.getEncoder().encodeToString(raw.getBytes()); // Replace with real encryption later
    }


}
