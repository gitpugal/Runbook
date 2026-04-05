package com.runbook.engine.service;

import com.runbook.engine.domain.OrgDatabase;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SapMetadataService {

    public List<String> listODataEntities(OrgDatabase db, String decryptedPassword) {
        // Call SAP OData service catalog endpoint
        // Parse entity sets from XML metadata
        return List.of("SalesOrder", "Material", "Customer");
    }
}
