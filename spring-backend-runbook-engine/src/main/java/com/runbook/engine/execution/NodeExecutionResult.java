package com.runbook.engine.execution;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NodeExecutionResult {

    private String branch; // null, "true", "false"

    public static NodeExecutionResult success() {
        return NodeExecutionResult.builder().build();
    }

    public static NodeExecutionResult branch(String branch) {
        return NodeExecutionResult.builder().branch(branch).build();
    }
}
