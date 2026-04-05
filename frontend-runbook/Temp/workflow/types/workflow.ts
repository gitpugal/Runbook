export type WorkflowNodeType =
    | "DATA_FETCH"
    | "CONDITION"
    | "FILTER"
    | "DATA_UPDATE"
    | "TOOL_TRIGGER";

export interface WorkflowNodeData {
    type: WorkflowNodeType;
    label: string;
    config: any;
}
