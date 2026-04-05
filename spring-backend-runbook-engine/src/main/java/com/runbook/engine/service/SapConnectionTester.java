package com.runbook.engine.service;

import com.runbook.engine.controller.dto.TestConnectionRequest;
import com.runbook.engine.controller.dto.TestConnectionResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Service
public class SapConnectionTester {

    private final RestTemplate restTemplate = new RestTemplate();

    public TestConnectionResponse test(TestConnectionRequest req) {
        try {
            String metadataUrl = buildMetadataUrl(req.getBaseUrl());

            HttpHeaders headers = new HttpHeaders();
            headers.setAccept(MediaType.parseMediaTypes("application/xml, application/json"));

            // 🔑 SANDBOX MODE (API Key based)
//            if (isSandbox(req.getBaseUrl())) {
                headers.set("APIKey", req.getPassword()); // we store API key in password field
                log.info("Testing SAP Sandbox connection to {}", metadataUrl);
//            }
//            // 🏢 REAL SAP MODE (Basic Auth + client)
//            else {
//                headers.setBasicAuth(req.getSapUsername(), req.getSapPassword());
//                if (req.getClient() != null && !req.getClient().isBlank()) {
//                    headers.set("sap-client", req.getClient());
//                }
//                log.info("Testing SAP Enterprise connection to {}", metadataUrl);
//            }

            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    metadataUrl,
                    HttpMethod.GET,
                    entity,
                    String.class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                return new TestConnectionResponse(true, "SAP connection successful");
            }

            return new TestConnectionResponse(false, "SAP responded with " + response.getStatusCode());

        } catch (Exception e) {
            log.error("SAP connection test failed", e);
            return new TestConnectionResponse(false, e.getMessage());
        }
    }

    private boolean isSandbox(String baseUrl) {
        return baseUrl != null && baseUrl.contains("sandbox.api.sap.com");
    }

    private String  buildMetadataUrl(String baseUrl) {
        // Default test API: Business Partner OData service
        return baseUrl + "/s4hanacloud/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_AddressEmailAddress";
    }
}
