export type WorkflowDefinition = {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
};

export type WorkflowNode = {
    id: string;
    type: string;
    data: {
        label: string;
        type: string;
        config: Record<string, unknown>;
    };
};

export type WorkflowEdge = {
    source: string;
    target: string;
    label?: string;
};

const promptTemplate = `You are an automation workflow generator for the Runbook platform.

Your job is to convert natural language automation descriptions into a valid workflow JSON definition.

You MUST output ONLY valid JSON.

Do NOT include explanations, markdown, or comments.

The output JSON must follow this exact structure:

{
  "nodes": [],
  "edges": []
}

Nodes define workflow steps.
Edges define execution flow between nodes.

--------------------------------------------------

NODE STRUCTURE

Every node must follow this structure:

{
  "id": "node_unique_id",
  "type": "NODE_TYPE",
  "data": {
    "label": "Human readable label",
    "type": "NODE_TYPE",
    "config": {}
  }
}

--------------------------------------------------

EDGE STRUCTURE

Edges connect nodes.

Default edge:

{
  "source": "node_1",
  "target": "node_2"
}

Condition branch edge:

{
  "source": "node_3",
  "target": "node_4",
  "label": "true"
}

{
  "source": "node_3",
  "target": "node_5",
  "label": "false"
}

--------------------------------------------------

WORKFLOW RULES

1. The workflow must be a DAG (no cycles).
2. The workflow must start with DATA_TRIGGER or WEBHOOK_TRIGGER.
3. Node IDs must be unique.
4. CONDITION nodes must branch using "true" and "false".
5. LOOP nodes iterate packets from a source node.
6. DATA_UPDATE can reuse previous filter results.
7. TOOL_TRIGGER executes external integrations.
8. All nodes must use the provided schema.

--------------------------------------------------

SUPPORTED NODE TYPES

DATA_TRIGGER
WEBHOOK_TRIGGER
DATA_FETCH
CONDITION
DATA_UPDATE
TOOL_TRIGGER
LOOP

--------------------------------------------------

NODE TYPE EXAMPLES

DATA_TRIGGER

{
  "id": "node_1",
  "type": "DATA_TRIGGER",
  "data": {
    "label": "Data Trigger",
    "type": "DATA_TRIGGER",
    "config": {}
  }
}

--------------------------------------------------

WEBHOOK_TRIGGER

{
  "id": "node_1",
  "type": "WEBHOOK_TRIGGER",
  "data": {
    "label": "Webhook Trigger",
    "type": "WEBHOOK_TRIGGER",
    "config": {}
  }
}

This node triggers workflows via HTTP webhook.

--------------------------------------------------

DATA_FETCH

{
  "id": "node_2",
  "type": "DATA_FETCH",
  "data": {
    "label": "Fetch Invites",
    "type": "DATA_FETCH",
    "config": {
      "schema": "public",
      "table": "org_invites",
      "filters": [
        {
          "column": "accepted",
          "operator": "=",
          "value": "false"
        }
      ]
    }
  }
}

This node queries a database table.

Filters structure:

{
  "column": "column_name",
  "operator": "=",
  "value": "value"
}

Valid operators include:

=
!=
>
<
>=
<=

--------------------------------------------------

CONDITION

{
  "id": "node_3",
  "type": "CONDITION",
  "data": {
    "label": "Check Accepted",
    "type": "CONDITION",
    "config": {
      "filters": [
        {
          "column": "accepted",
          "operator": "=",
          "value": "false"
        }
      ],
      "aggregation": "ANY"
    }
  }
}

Aggregation options:

ANY
ALL
NONE

This node evaluates packets and branches execution.

--------------------------------------------------

DATA_UPDATE

Standard update example:

{
  "id": "node_4",
  "type": "DATA_UPDATE",
  "data": {
    "label": "Update Invite",
    "type": "DATA_UPDATE",
    "config": {
      "table": "org_invites",
      "filters": [
        {
          "column": "accepted",
          "operator": "=",
          "value": "false"
        }
      ],
      "updates": [
        {
          "column": "reminder_sent",
          "value": "true"
        }
      ],
      "usePreviousFilter": false
    }
  }
}

Update using previous node results:

{
  "id": "node_4",
  "type": "DATA_UPDATE",
  "data": {
    "label": "Update Invite",
    "type": "DATA_UPDATE",
    "config": {
      "updates": [
        {
          "column": "reminder_sent",
          "value": "true"
        }
      ],
      "usePreviousFilter": true
    }
  }
}

--------------------------------------------------

TOOL_TRIGGER

Example email tool:

{
  "id": "node_5",
  "type": "TOOL_TRIGGER",
  "data": {
    "label": "Send Email",
    "type": "TOOL_TRIGGER",
    "config": {
      "toolName": "email_tool",
      "includePrevious": true,
      "payload": "{ \\"subject\\": \\"Reminder\\", \\"body\\": \\"Please accept invite\\" }"
    }
  }
}

Supported tool names may include:

email_tool
http_tool
kafka_tool
slack_tool
ai_tool

--------------------------------------------------

LOOP

Used to iterate packets from another node.

{
  "id": "node_6",
  "type": "LOOP",
  "data": {
    "label": "Loop Rows",
    "type": "LOOP",
    "config": {
      "sourceNode": "node_2"
    }
  }
}

--------------------------------------------------

FULL WORKFLOW EXAMPLE

{
  "nodes": [
    {
      "id": "node_1",
      "type": "WEBHOOK_TRIGGER",
      "data": {
        "label": "Webhook Trigger",
        "type": "WEBHOOK_TRIGGER",
        "config": {}
      }
    },
    {
      "id": "node_2",
      "type": "DATA_FETCH",
      "data": {
        "label": "Fetch Invites",
        "type": "DATA_FETCH",
        "config": {
          "schema": "public",
          "table": "org_invites",
          "filters": []
        }
      }
    },
    {
      "id": "node_3",
      "type": "CONDITION",
      "data": {
        "label": "Check Accepted",
        "type": "CONDITION",
        "config": {
          "filters": [
            {
              "column": "accepted",
              "operator": "=",
              "value": "false"
            }
          ],
          "aggregation": "ANY"
        }
      }
    },
    {
      "id": "node_4",
      "type": "TOOL_TRIGGER",
      "data": {
        "label": "Send Reminder Email",
        "type": "TOOL_TRIGGER",
        "config": {
          "toolName": "email_tool",
          "includePrevious": true,
          "payload": "{ \\"subject\\": \\"Reminder\\", \\"body\\": \\"Please accept invite\\" }"
        }
      }
    }
  ],
  "edges": [
    {
      "source": "node_1",
      "target": "node_2"
    },
    {
      "source": "node_2",
      "target": "node_3"
    },
    {
      "source": "node_3",
      "target": "node_4",
      "label": "false"
    }
  ]
}

--------------------------------------------------

USER REQUEST

Generate a workflow for the following automation description:

{{USER_PROMPT}}`;

export function buildWorkflowGeneratorPrompt(userPrompt: string) {
    return promptTemplate.replace("{{USER_PROMPT}}", userPrompt.trim());
}

export function isWorkflowDefinition(value: unknown): value is WorkflowDefinition {
    if (!value || typeof value !== "object") {
        return false;
    }

    const candidate = value as Partial<WorkflowDefinition>;

    if (!Array.isArray(candidate.nodes) || !Array.isArray(candidate.edges)) {
        return false;
    }

    return (
        candidate.nodes.every((node) => {
            if (!node || typeof node !== "object") {
                return false;
            }

            const workflowNode = node as Partial<WorkflowNode>;
            return (
                typeof workflowNode.id === "string" &&
                typeof workflowNode.type === "string" &&
                !!workflowNode.data &&
                typeof workflowNode.data === "object" &&
                typeof workflowNode.data.label === "string" &&
                typeof workflowNode.data.type === "string" &&
                !!workflowNode.data.config &&
                typeof workflowNode.data.config === "object" &&
                !Array.isArray(workflowNode.data.config)
            );
        }) &&
        candidate.edges.every((edge) => {
            if (!edge || typeof edge !== "object") {
                return false;
            }

            const workflowEdge = edge as Partial<WorkflowEdge>;
            return (
                typeof workflowEdge.source === "string" &&
                typeof workflowEdge.target === "string" &&
                (workflowEdge.label === undefined || typeof workflowEdge.label === "string")
            );
        })
    );
}

export const workflowDefinitionJsonSchema = {
    name: "workflow_definition",
    schema: {
        type: "object",
        additionalProperties: false,
        required: ["nodes", "edges"],
        properties: {
            nodes: {
                type: "array",
                items: {
                    type: "object",
                    additionalProperties: false,
                    required: ["id", "type", "data"],
                    properties: {
                        id: { type: "string" },
                        type: { type: "string" },
                        data: {
                            type: "object",
                            additionalProperties: false,
                            required: ["label", "type", "config"],
                            properties: {
                                label: { type: "string" },
                                type: { type: "string" },
                                config: {
                                    type: "object",
                                    additionalProperties: true,
                                },
                            },
                        },
                    },
                },
            },
            edges: {
                type: "array",
                items: {
                    type: "object",
                    additionalProperties: false,
                    required: ["source", "target"],
                    properties: {
                        source: { type: "string" },
                        target: { type: "string" },
                        label: { type: "string" },
                    },
                },
            },
        },
    },
} as const;
