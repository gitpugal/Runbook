package com.runbook.engine.controller;

import com.runbook.engine.controller.dto.CreateDatabaseRequest;
import com.runbook.engine.controller.dto.OrgDatabaseResponse;
import com.runbook.engine.domain.OrgDatabase;
import com.runbook.engine.service.OrgDatabaseService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/orgs/{orgId}/databases")
@RequiredArgsConstructor
public class OrgDatabaseController {

    private final OrgDatabaseService service;

    @PostMapping
    public OrgDatabaseResponse create(@PathVariable UUID orgId, @RequestBody CreateDatabaseRequest req) {
        return service.create(orgId, req);
    }

    @GetMapping
    public List<OrgDatabaseResponse> list(@PathVariable UUID orgId) {
        return service.list(orgId);
    }

}
