package com.runbook.engine.execution.executors.tools;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class ToolExecutorFactory {

    /**
     * Spring automatically injects:
     * Map<beanName, ToolExecutor>
     */
    private final Map<String, ToolExecutor> executorMap;

    public ToolExecutor getExecutor(String toolName) {

        ToolExecutor executor = executorMap.get(toolName);

        if (executor == null) {
            throw new IllegalArgumentException(
                    "No ToolExecutor registered with name: " + toolName
            );
        }

        return executor;
    }
}