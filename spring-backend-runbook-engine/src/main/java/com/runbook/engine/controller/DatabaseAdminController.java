package com.runbook.engine.controller;

import com.runbook.engine.controller.dto.TestConnectionRequest;
import com.runbook.engine.controller.dto.TestConnectionResponse;
import com.runbook.engine.service.ConnectionTestService;
import com.runbook.engine.service.OrgDatabaseService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/databases")
@RequiredArgsConstructor
public class DatabaseAdminController {

    private final OrgDatabaseService service;
    private final ConnectionTestService connectionTestService;

    @DeleteMapping("/{dbId}")
    public void delete(@PathVariable UUID dbId) {
        service.delete(dbId);
    }



    @PostMapping("/test-connection")
    public TestConnectionResponse testConnection(@RequestBody TestConnectionRequest req) {
        return connectionTestService.test(req);
    }

}
