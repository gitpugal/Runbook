package com.runbook.engine.execution.executors;

import com.runbook.engine.execution.*;
import com.runbook.engine.execution.executors.tools.ToolExecutor;
import com.runbook.engine.execution.executors.tools.ToolExecutorFactory;
import com.runbook.engine.execution.graph.WorkflowNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class ToolTriggerExecutor implements NodeExecutor {

    private final ToolExecutorFactory toolExecutorFactory;

    @Override
    public String getType() {
        return "TOOL_TRIGGER";
    }

    @Override
    public NodeExecutionResult execute(
            WorkflowNode node,
            ExecutionContext context
    ) {

        Map<String, Object> config = node.getConfigOrEmpty();

        String toolName = config.get("toolName").toString();

        ToolExecutor tool =
                toolExecutorFactory.getExecutor(toolName);


        Object output = tool.execute(node, context);
        context.storeNodeOutput(node.getId(), output);

        return NodeExecutionResult.success();
    }
}
