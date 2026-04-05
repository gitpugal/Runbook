package com.runbook.engine.execution.executors;

import com.runbook.engine.execution.ExecutionContext;
import com.runbook.engine.execution.NodeExecutionResult;
import com.runbook.engine.execution.graph.WorkflowNode;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class LoopExecutor implements NodeExecutor {

    @Override
    public String getType() {
        return "LOOP";
    }

    @Override
    public NodeExecutionResult execute(WorkflowNode node, ExecutionContext context) {
        context.storeNodeOutput(
                node.getId(),
                Map.of(
                        "sourceNode", node.getConfigOrEmpty().get("sourceNode"),
                        "items", context.get().size()
                )
        );
        return NodeExecutionResult.success();
    }
}
