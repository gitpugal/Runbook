# Workflow Engine Technical Guide

This guide explains the workflow engine in this project from first principles, with enough detail for a Spring Boot beginner and enough depth for production engineering.

## 1. Purpose and Mental Model

The workflow engine executes a user-defined workflow (nodes + edges) as a directed graph.

At runtime, the engine does this:
1. Parses workflow JSON into an in-memory graph.
2. Finds the start node (`DATA_TRIGGER`).
3. Delegates each node execution through Kafka (producer-consumer model).
4. Runs the node with a node-specific executor.
5. Routes to next node(s) with execution context.
6. Persists final execution status and emits progress events.

Think of the engine as two layers:
- Control plane: orchestration, state tracking, routing, lifecycle.
- Data plane: actual node business logic (fetch, filter, update, tool trigger).

## 2. High-Level Architecture

Main classes and responsibilities:

- `com.runbook.engine.execution.executors.WorkflowExecutionEngine`
  - Central orchestrator.
  - Starts workflow runs.
  - Tracks in-flight tasks and runtime state.
  - Dispatches tasks to Kafka topics by node type.
  - Finalizes execution (`SUCCESS` or `FAILED`).

- `com.runbook.engine.execution.WorkflowParser`
  - Converts stored workflow JSON into `WorkflowGraph`.

- `com.runbook.engine.execution.graph.WorkflowGraph`
  - In-memory representation of nodes + edges.
  - Resolves trigger and next node(s).

- `com.runbook.engine.execution.ExecutionContext`
  - Carries mutable runtime data between nodes.
  - Holds packets and condition branch outputs.

- `com.runbook.engine.execution.executors.NodeExecutor` + implementations
  - Node-type specific behavior.
  - `DataTriggerExecutor`, `DataFetchExecutor`, `ConditionExecutor`, `DataUpdateExecutor`, `ToolTriggerExecutor`.

- `com.runbook.engine.execution.kafka.NodeExecutionProducer`
  - Publishes node tasks to Kafka topic based on node type.

- `com.runbook.engine.execution.kafka.NodeExecutionConsumer`
  - Consumes tasks from node-type topics and invokes engine processing.

- `com.runbook.engine.execution.ExecutionEventPublisher`
  - SSE publisher for quick-run progress events.

- `com.runbook.engine.execution.WorkflowExecution`
  - JPA entity storing run metadata (`RUNNING`, `SUCCESS`, `FAILED`, timestamps).

- `com.runbook.engine.repository.WorkflowExecutionRepository`
  - Persistence for execution entity.

- `com.runbook.engine.service.WorkflowRunnerService`
  - Async entrypoint from API to engine.

## 3. Key Technical Concepts (Beginner Friendly)

### 3.1 Directed Graph
A workflow is a directed graph:
- Node: a unit of work.
- Edge: a directed link to the next node.

Condition node adds branching:
- `true` branch
- `false` branch

### 3.2 Producer-Consumer with Kafka
Instead of calling the next node directly in the same stack frame, this engine pushes a task message to Kafka.

- Producer: sends `NodeExecutionTask` to a topic.
- Consumer: receives task and executes node.

This gives:
- Decoupling between orchestration and execution scheduling.
- Potential horizontal scale by running multiple consumers.
- Controlled async processing.

### 3.3 Execution Context
A workflow run needs shared data across nodes. `ExecutionContext` is that runtime container.

It stores:
- Current packets (`nodeOutputs`)
- Condition branch buckets (`conditionNodes` by key like `nodeId:true`)

Context is copied for branch isolation in condition fan-out.

### 3.4 Idempotency and Reliability Consideration
Kafka delivery can be at-least-once depending on configuration. Executors should be written carefully so duplicate processing does not corrupt state.

In this codebase:
- Task tracking is in-memory (`runtimeStates` map).
- This is suitable for single-instance lifecycle orchestration.
- For strict distributed fault tolerance, state should move to external durable storage.

## 4. Data Structures in the Engine

### 4.1 Workflow Definition JSON
Stored in `Workflow.definition` as JSON:
- `nodes`: array
- `edges`: array

Each node contains:
- `id`
- `data.type`
- `data.config`

Each edge contains:
- `source`
- `target`
- optional `sourceHandle` (used as branch key for condition routing)

### 4.2 WorkflowGraph
`WorkflowGraph` has:
- `Map<String, WorkflowNode> nodes`
- `Map<String, Map<String, String>> adjacency`

Adjacency key model:
- default path key: `default`
- condition branch keys: `true`, `false`

### 4.3 NodeExecutionTask (Kafka payload)
Fields:
- `executionId`: workflow run id
- `nodeId`: node to execute
- `contextId`: key for fetching context from runtime state map
- `quick`: whether to emit SSE progress

### 4.4 RuntimeState (inside engine)
For each active execution:
- `WorkflowGraph graph`
- `WorkflowExecution execution` (entity)
- `quick` flag
- `AtomicInteger inFlightTasks`
- `AtomicBoolean failed`
- `AtomicBoolean finished`
- `ConcurrentMap<UUID, ExecutionContext> contextById`

## 5. Execution Lifecycle (Step-by-Step)

### 5.1 Start (`WorkflowExecutionEngine.execute`)
1. Validate inputs.
2. Create `WorkflowExecution` with `RUNNING` and `startedAt`.
3. Parse definition JSON into graph.
4. Initialize runtime state and register in `runtimeStates`.
5. Find start node (`DATA_TRIGGER`).
6. Enqueue first Kafka task with fresh context.

### 5.2 Enqueue (`enqueueNodeTask`)
1. Resolve node from graph.
2. Generate `contextId`.
3. Store context in `contextById`.
4. Increment `inFlightTasks`.
5. Publish task to node-type topic.

If publish fails, rollback context storage and decrement in-flight count.

### 5.3 Consume (`NodeExecutionConsumer`)
1. Receive raw string payload from Kafka.
2. Deserialize using `tools.jackson.ObjectMapper`.
3. Call `workflowExecutionEngine.processNodeTask(task)`.

### 5.4 Process Node Task (`processNodeTask`)
1. Validate task fields.
2. Load runtime state by `executionId`.
3. Skip if state already marked failed.
4. Load and remove context by `contextId`.
5. Execute node logic.
6. On any error, mark execution failed.
7. Always decrement in-flight counter.
8. If in-flight reaches zero, finalize execution.

### 5.5 Execute Node (`executeNode`)
1. Optional quick-run SSE `NODE_STARTED`.
2. Artificial delay (`Thread.sleep(4000)`) retained for behavior parity.
3. Resolve node executor by `node.getType()`.
4. Run executor logic.
5. Optional quick-run SSE `NODE_COMPLETED`.
6. Route to next nodes:
   - Condition node: split true/false contexts and enqueue each branch.
   - Non-condition node: enqueue default next node(s).

### 5.6 Finalization (`finalizeExecution`)
1. Only run once (`finished.compareAndSet(false, true)`).
2. Set status:
   - `FAILED` if failure flag set
   - otherwise `SUCCESS`
3. Set `finishedAt`.
4. Serialize final context marker JSON.
5. Persist execution entity.
6. Emit quick-run `WORKFLOW_COMPLETED` event if success.
7. Complete SSE stream for quick run.
8. Remove runtime state from memory.

## 6. Node Executors and Behavior

All executors implement:
- `String getType()`
- `NodeExecutionResult execute(WorkflowNode node, ExecutionContext context)`

### 6.1 DataTriggerExecutor
Type: `DATA_TRIGGER`
- Entry node placeholder.
- Does not mutate context.

### 6.2 DataFetchExecutor
Type: `DATA_FETCH`
- Reads config (`schema`, `table`, `filters`).
- Builds `DataQuery`.
- Calls `DataPacketFactory.query`.
- Stores fetched packets as current context payload.

### 6.3 ConditionExecutor
Type: `CONDITION`
- Reads `filters` from config.
- Evaluates each packet against filters.
- Splits packets into positive and negative lists.
- Stores in context keys:
  - `nodeId:true`
  - `nodeId:false`

### 6.4 DataUpdateExecutor
Type: `DATA_UPDATE`
- Reads update specs from config.
- Converts incoming values to existing packet field type.
- Applies updates and calls `packet.save()`.

### 6.5 ToolTriggerExecutor
Type: `TOOL_TRIGGER`
- Currently no-op placeholder for future tool invocation integration.

## 7. Data Packet Layer (Query + Update Abstraction)

Package: `com.runbook.engine.execution.datapacket`

### 7.1 Why DataPacket Exists
It isolates workflow logic from raw JDBC SQL.

`DataPacket` encapsulates:
- row values
- business keys
- dirty fields
- attached repository for persistence

### 7.2 Important Classes
- `DataPacket`: mutable unit representing one row.
- `DataPacketFactory`: materializes packets from query/load.
- `DataQuery`: query model with filter conditions.
- `FilterCondition`: one where-clause condition.
- `JdbcDataPacketRepository`: concrete JDBC implementation.

### 7.3 SQL Safety in Repository
`JdbcDataPacketRepository` validates:
- identifiers (schema/table/column names) via regex
- operators via allowlist (`=`, `!=`, `<>`, `>`, `>=`, `<`, `<=`, `LIKE`, `ILIKE`)

This protects dynamic SQL construction from invalid identifiers/operators.

## 8. Event Streaming for UI (SSE)

`ExecutionEventPublisher` uses `SseEmitter`.

For quick runs (`isQuick=true`), engine emits:
- `NODE_STARTED`
- `NODE_COMPLETED`
- `WORKFLOW_COMPLETED` or `WORKFLOW_FAILED`

Consumer lifecycle callbacks:
- on completion: remove emitter
- on timeout: remove emitter
- on error: remove emitter

## 9. Spring Boot Wiring Concepts Used

### 9.1 Dependency Injection
Classes are wired by constructor injection via `@RequiredArgsConstructor`.

### 9.2 Component Types
- `@Service`: business orchestration (`WorkflowExecutionEngine`, services)
- `@Component`: generic beans (`ExecutionEventPublisher`, Kafka producer/consumer)
- `@Repository`: data access (`JdbcDataPacketRepository`)
- `@Configuration`: topic beans (`NodeExecutionKafkaConfig`)

### 9.3 Kafka Listener Container
`@KafkaListener` creates managed listener containers.

Startup can fail if serializers/deserializers are incompatible. This project uses string payloads to avoid `com.fasterxml.jackson` dependency mismatch with `tools.jackson`.

## 10. Configuration Reference

In `application.yml`:
- `spring.kafka.bootstrap-servers`
- `spring.kafka.producer.*`
- `spring.kafka.consumer.*`
- `spring.kafka.listener.*`

Custom property:
- `runbook.execution.kafka.create-topics` (default true)
  - controls topic bean creation from `NodeExecutionKafkaConfig`.

## 11. Concurrency and Thread Safety

Thread-safe constructs used:
- `ConcurrentHashMap` for runtime state and context storage.
- `AtomicInteger` for in-flight task count.
- `AtomicBoolean` for failed/finished guard.

Why needed:
- Multiple Kafka listener threads can process tasks concurrently.
- Finalization must happen exactly once.

## 12. Failure Handling Strategy

Node failure path:
1. Exception in executor or processing.
2. Engine marks execution as failed once.
3. Emits `WORKFLOW_FAILED` for quick mode.
4. Waits for in-flight drain to finalize status persist.

Important note:
- Because `runtimeStates` is in-memory, process restart during active execution loses orchestration state.
- If strict recoverability is needed, persist orchestration state externally.

## 13. Extending the Engine (Add a New Node Type)

Example process to add node type `EMAIL_SEND`:

1. Create executor:
- Implement `NodeExecutor`.
- Return `getType() = "EMAIL_SEND"`.
- Implement logic in `execute`.

2. Add Kafka topic mapping:
- Add constant in `NodeExecutionTopics`.
- Map node type to topic in `forNodeType` map.

3. Add listener method:
- Add `@KafkaListener(topics = ...)` method in `NodeExecutionConsumer`.
- Route to common `process(payload)`.

4. Optional topic bean:
- Add `NewTopic` bean in `NodeExecutionKafkaConfig`.

5. Update workflow builder/frontend so node `data.type` matches executor type.

6. Add tests:
- Unit test executor behavior.
- Integration test (recommended) for dispatch and consume path.

## 14. End-to-End Sequence (Textual)

1. API triggers run.
2. `WorkflowRunnerService` starts async execution.
3. `WorkflowExecutionEngine.execute` stores `RUNNING` + enqueues start node task.
4. Kafka listener consumes task.
5. Engine processes task:
   - execute node
   - enqueue next task(s)
6. Repeat until no tasks remain.
7. Engine finalizes execution and persists terminal status.
8. SSE stream completes (quick mode).

## 15. Beginner Debugging Checklist

If run does not progress:
1. Verify Kafka broker reachable at `spring.kafka.bootstrap-servers`.
2. Verify node type in workflow JSON exactly matches executor `getType()`.
3. Check logs for `No NodeExecutor registered for type`.
4. Check logs for payload deserialization errors in `NodeExecutionConsumer`.
5. Check DB row in `workflow_executions` for status/timestamps.

If context seems empty unexpectedly:
1. Confirm upstream executor stores context (`context.store(...)`).
2. Confirm condition branch keys (`nodeId:true`, `nodeId:false`) are read correctly.
3. Confirm downstream node gets expected branch path.

If SQL update fails:
1. Check business keys exist on packet (usually `id`).
2. Check identifier/operator validation errors.
3. Check conversion in `DataUpdateExecutor.convertToCorrectType`.

## 16. Production Readiness Notes

Current strengths:
- Clear orchestration boundaries.
- Type-based node dispatch.
- Defensive validation in parser/graph/repository.
- Test coverage on parser/context/query safety.

Recommended next hardening for full distributed resilience:
1. Persist orchestration runtime state (context and in-flight graph progress).
2. Add idempotency keys per node task.
3. Add dead-letter topics and retry policy.
4. Add metrics (task lag, node latency, failure counts).
5. Add structured trace IDs across execution and Kafka headers.
6. Add integration tests with embedded Kafka/Testcontainers.

## 17. Glossary

- Workflow: user-defined graph of nodes and edges.
- Node: one operation in a workflow.
- Edge: transition from one node to another.
- Context: runtime payload shared between nodes.
- Packet: one row-like unit of data.
- Quick run: execution mode that emits real-time SSE events.
- In-flight task: task published and not yet fully completed/finalized.

## 18. File Map (Quick Navigation)

- Engine orchestrator:
  - `src/main/java/com/runbook/engine/execution/executors/WorkflowExecutionEngine.java`
- Graph parser/model:
  - `src/main/java/com/runbook/engine/execution/WorkflowParser.java`
  - `src/main/java/com/runbook/engine/execution/graph/WorkflowGraph.java`
  - `src/main/java/com/runbook/engine/execution/graph/WorkflowNode.java`
- Runtime context/events:
  - `src/main/java/com/runbook/engine/execution/ExecutionContext.java`
  - `src/main/java/com/runbook/engine/execution/ExecutionEventPublisher.java`
- Kafka dispatch:
  - `src/main/java/com/runbook/engine/execution/kafka/NodeExecutionTask.java`
  - `src/main/java/com/runbook/engine/execution/kafka/NodeExecutionTopics.java`
  - `src/main/java/com/runbook/engine/execution/kafka/NodeExecutionProducer.java`
  - `src/main/java/com/runbook/engine/execution/kafka/NodeExecutionConsumer.java`
  - `src/main/java/com/runbook/engine/execution/kafka/NodeExecutionKafkaConfig.java`
- Node executors:
  - `src/main/java/com/runbook/engine/execution/executors/*.java`
- Data packet layer:
  - `src/main/java/com/runbook/engine/execution/datapacket/*.java`
- Execution persistence:
  - `src/main/java/com/runbook/engine/execution/WorkflowExecution.java`
  - `src/main/java/com/runbook/engine/repository/WorkflowExecutionRepository.java`

---

If you are new to Spring Boot, start by reading sections 1, 3, 5, and 10 first, then revisit sections 11 to 16 for production details.
