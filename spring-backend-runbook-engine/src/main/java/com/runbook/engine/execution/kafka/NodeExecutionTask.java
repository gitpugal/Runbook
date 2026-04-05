package com.runbook.engine.execution.kafka;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NodeExecutionTask {

    private UUID executionId;
    private String nodeId;
    private UUID contextId;
    private boolean quick;
}
