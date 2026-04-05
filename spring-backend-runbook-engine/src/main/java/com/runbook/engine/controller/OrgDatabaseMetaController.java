package com.runbook.engine.controller;

import com.runbook.engine.controller.dto.TableSchemaDTO;
import com.runbook.engine.service.OrgDatabaseMetaService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/orgs/{orgId}/databases/{dbId}/meta")
@RequiredArgsConstructor
public class OrgDatabaseMetaController {

    private final OrgDatabaseMetaService metaService;

    @GetMapping("/tables")
    public List<String> listTables(@PathVariable UUID dbId) throws Exception {
        return metaService.listTables(dbId);
    }

    @GetMapping("/tables/{tableName}/schema")
    public TableSchemaDTO getSchema(
            @PathVariable UUID dbId,
            @PathVariable String tableName
    ) throws Exception {
        return metaService.getTableSchema(dbId, tableName);
    }
}
