package com.runbook.engine.service;

import com.runbook.engine.controller.dto.TestConnectionRequest;
import com.runbook.engine.controller.dto.TestConnectionResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ConnectionTestService {

    private final SqlConnectionTester sqlTester;
    private final SapConnectionTester sapTester;

    public TestConnectionResponse test(TestConnectionRequest req) {
        return switch (req.getType()) {
            case SAP -> sapTester.test(req);
            default -> sqlTester.test(req);
        };
    }
}
