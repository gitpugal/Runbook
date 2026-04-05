package com.runbook.engine.execution.executors;

import com.runbook.engine.execution.ExecutionContext;
import com.runbook.engine.execution.NodeExecutionResult;
import com.runbook.engine.execution.graph.WorkflowNode;
import org.springframework.stereotype.Component;

@Component
public class WebhookTriggerExecutor implements NodeExecutor {

    @Override
    public String getType() {
        return "WEBHOOK_TRIGGER";
    }

    @Override
    public NodeExecutionResult execute(WorkflowNode node, ExecutionContext context) {
        context.storeNodeOutput(node.getId(), context.snapshot().get("trigger"));
        return NodeExecutionResult.success();
    }
}
