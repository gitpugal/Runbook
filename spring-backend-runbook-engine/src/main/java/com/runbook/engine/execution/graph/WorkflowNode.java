package com.runbook.engine.execution.graph;

import lombok.Data;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

@Data
public class WorkflowNode {

    private String id;
    private String type;
    private Map<String, Object> config;

    public Map<String, Object> getConfigOrEmpty() {
        return config == null ? Collections.emptyMap() : config;
    }

    public WorkflowNode withConfig(Map<String, Object> resolvedConfig) {
        WorkflowNode clone = new WorkflowNode();
        clone.setId(id);
        clone.setType(type);
        clone.setConfig(resolvedConfig == null ? Collections.emptyMap() : new LinkedHashMap<>(resolvedConfig));
        return clone;
    }
}
