package com.runbook.engine.execution.executors.tools;

import com.runbook.engine.execution.ExecutionContext;
import com.runbook.engine.execution.graph.WorkflowNode;

public interface ToolExecutor {
    Object execute(WorkflowNode node,
                   ExecutionContext context);
    String getType();
}
