package com.runbook.engine.execution;

import com.runbook.engine.execution.graph.WorkflowGraph;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

class WorkflowParserTest {

    @Test
    void parseBuildsNodesAndEdges() {
        String json = """
                {
                  "nodes": [
                    {"id": "n1", "data": {"type": "DATA_TRIGGER", "config": {}}},
                    {"id": "n2", "data": {"type": "DATA_FETCH", "config": {"table": "users"}}}
                  ],
                  "edges": [
                    {"source": "n1", "target": "n2", "sourceHandle": null}
                  ]
                }
                """;

        WorkflowGraph graph = WorkflowParser.parse(json);

        assertEquals("n1", graph.findTriggerNode());
        assertNotNull(graph.getNode("n2"));
        assertEquals(List.of("n2"), graph.getNextNodes("n1", "success"));
    }

    @Test
    void parseFailsForMissingRequiredField() {
        String invalidJson = """
                {
                  "nodes": [
                    {"data": {"type": "DATA_TRIGGER", "config": {}}}
                  ],
                  "edges": []
                }
                """;

        RuntimeException exception = assertThrows(RuntimeException.class, () -> WorkflowParser.parse(invalidJson));
        assertNotNull(exception.getCause());
    }
}
