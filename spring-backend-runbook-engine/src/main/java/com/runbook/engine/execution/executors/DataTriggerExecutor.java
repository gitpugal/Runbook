package com.runbook.engine.execution.executors;

import com.runbook.engine.execution.ExecutionContext;
import com.runbook.engine.execution.NodeExecutionResult;
import com.runbook.engine.execution.graph.WorkflowNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class DataTriggerExecutor implements NodeExecutor {

    @Override
    public String getType() {
        return "DATA_TRIGGER";
    }

    @Override
    public NodeExecutionResult execute(
            WorkflowNode node,
            ExecutionContext context
    ) {
        log.debug("==> DATA TRIGGER RAN");
        context.storeNodeOutput(node.getId(), context.snapshot().get("trigger"));
        return NodeExecutionResult.success();
    }
}
