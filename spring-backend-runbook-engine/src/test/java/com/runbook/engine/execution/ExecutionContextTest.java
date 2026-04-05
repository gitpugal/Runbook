package com.runbook.engine.execution;

import com.runbook.engine.execution.datapacket.DataPacket;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotSame;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ExecutionContextTest {

    @Test
    void copyConstructorCreatesIndependentCollections() {
        ExecutionContext original = new ExecutionContext();
        DataPacket packet = new DataPacket("public", "users");
        original.store(List.of(packet));
        original.store("condition:true", List.of(packet));

        ExecutionContext copy = new ExecutionContext(original);
        copy.store(List.of());
        copy.store("condition:true", List.of());

        assertEquals(1, original.get().size());
        assertEquals(1, original.get("condition:true").size());
        assertNotSame(original.get(), copy.get());
    }

    @Test
    void storeHandlesNullCollections() {
        ExecutionContext context = new ExecutionContext();

        context.store((List<DataPacket>) null);
        context.store("condition:false", null);

        assertTrue(context.get().isEmpty());
        assertTrue(context.get("condition:false").isEmpty());
    }

    @Test
    void resolveExpressionsUsesStoredVariablesAndNodeOutputs() {
        ExecutionContext context = new ExecutionContext();
        context.putVariable("user", java.util.Map.of("email", "user@example.com"));
        context.storeNodeOutput("fetch_users", java.util.List.of(java.util.Map.of("email", "user@example.com")));

        Object resolvedObject = context.resolveExpressions("{{context.user.email}}");
        Object resolvedString = context.resolveExpressions("Notify {{context.user.email}}");

        assertEquals("user@example.com", resolvedObject);
        assertEquals("Notify user@example.com", resolvedString);
    }
}
