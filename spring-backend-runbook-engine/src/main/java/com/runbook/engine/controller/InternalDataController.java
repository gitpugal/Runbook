package com.runbook.engine.controller;

import com.runbook.engine.controller.dto.*;
import com.runbook.engine.service.InternalDataService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/orgs/{orgId}/internal-data")
@RequiredArgsConstructor
public class InternalDataController {

    private final InternalDataService internalDataService;

    @PostMapping("/domains")
    public OrganizationEnvironmentResponse createEnvironment(@PathVariable UUID orgId, @RequestBody CreateInternalDataDomainRequest request) {
        return internalDataService.createEnvironment(orgId, request);
    }

    @GetMapping("/environment")
    public EnvironmentDataResponse getEnvironment(@RequestParam UUID orgId, @RequestParam UUID envId) {
        return internalDataService.getEnvironment(orgId, envId);
    }

    @GetMapping("/workspace")
    public InternalDataWorkspaceResponse getWorkspace(@PathVariable UUID orgId) {
        return internalDataService.getWorkspace(orgId);
    }

//    @PostMapping("/domains")
//    public DataDomainResponse createDomain(@PathVariable UUID orgId, @RequestBody CreateInternalDataDomainRequest request) {
//        return internalDataService.createDomain(orgId, request);
//    }

    @GetMapping("/domains")
    public List<DataDomainResponse> listDomains(@PathVariable UUID orgId) {
        return internalDataService.listDomains(orgId);
    }

    @PostMapping("/entities")
    public EntityDefinitionResponse createEntity(@PathVariable UUID orgId, @RequestBody CreateInternalEntityRequest request) {
        return internalDataService.createEntity(orgId, request);
    }

    @GetMapping("/entities")
    public List<EntityDefinitionResponse> listEntities(@PathVariable UUID orgId, @PathVariable UUID envId) {
        return internalDataService.listEntities(orgId, envId);
    }

    @PostMapping("/entities/{entityId}/columns")
    public EntityDefinitionResponse addColumn(
            @PathVariable UUID orgId,
            @PathVariable UUID entityId,
            @RequestBody InternalColumnDefinitionRequest request
    ) {
        return internalDataService.addColumn(orgId, entityId, request);
    }

    @PostMapping("/relationships")
    public RelationshipDefinitionResponse createRelationship(
            @PathVariable UUID orgId,
            @RequestBody CreateInternalRelationshipRequest request
    ) {
        return internalDataService.createRelationship(orgId, request);
    }

    @GetMapping("/relationships")
    public List<RelationshipDefinitionResponse> listRelationships(@PathVariable UUID orgId, @PathVariable UUID envId) {
        return internalDataService.listRelationships(orgId, envId);
    }

    @GetMapping("/meta/tables")
    public List<String> listTables(@PathVariable UUID orgId) {
        return internalDataService.listInternalTables(orgId);
    }

    @GetMapping("/meta/tables/{tableName}/schema")
    public TableSchemaDTO getTableSchema(@PathVariable UUID orgId, @PathVariable String tableName) {
        return internalDataService.getInternalTableSchema(orgId, tableName);
    }

    @GetMapping("/entities/{entityId}/rows")
    public InternalDataRowsResponse listRows(
            @PathVariable UUID orgId,
            @PathVariable UUID entityId,
            @RequestParam(required = false) String filterColumn,
            @RequestParam(required = false) String filterValue,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDirection,
            @RequestParam(required = false) Integer limit
    ) {
        return internalDataService.listRows(orgId, entityId, filterColumn, filterValue, sortBy, sortDirection, limit);
    }

    @PostMapping("/entities/{entityId}/rows")
    public Map<String, Object> insertRow(
            @PathVariable UUID orgId,
            @PathVariable UUID entityId,
            @RequestBody InternalRowUpsertRequest request
    ) {
        return internalDataService.insertRow(orgId, entityId, request);
    }

    @PutMapping("/entities/{entityId}/rows/{rowId}")
    public Map<String, Object> updateRow(
            @PathVariable UUID orgId,
            @PathVariable UUID entityId,
            @PathVariable UUID rowId,
            @RequestBody InternalRowUpsertRequest request
    ) {
        return internalDataService.updateRow(orgId, entityId, rowId, request);
    }

    @DeleteMapping("/entities/{entityId}/rows/{rowId}")
    public void deleteRow(@PathVariable UUID orgId, @PathVariable UUID entityId, @PathVariable UUID rowId) {
        internalDataService.deleteRow(orgId, entityId, rowId);
    }
}
