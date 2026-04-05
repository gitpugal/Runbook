package com.runbook.engine.execution.executors;

import com.runbook.engine.execution.ExecutionContext;
import com.runbook.engine.execution.NodeExecutionResult;
import com.runbook.engine.execution.graph.WorkflowNode;

public interface NodeExecutor {

    String getType();

    NodeExecutionResult execute(
            WorkflowNode node,
            ExecutionContext context
    );
}
