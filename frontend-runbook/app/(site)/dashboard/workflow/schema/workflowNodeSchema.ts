/* -------------------- node types -------------------- */

export type WorkflowNodeType =
    | "DATA_FETCH"
    | "CONDITION"
    | "DATA_UPDATE"
    | "TOOL_TRIGGER";

/* -------------------- configs -------------------- */

export interface FilterRule {
    column: string;
    operator: string;
    value: any;
}

/* DATA FETCH */
export interface DataFetchConfig {
    table: string;
    filters: FilterRule[];
}

/* CONDITION */
export interface ConditionConfig {
    filters: FilterRule[];
}

/* DATA UPDATE */
export interface UpdateRule {
    column: string;
    value: any;
}

export interface DataUpdateConfig {
    table: string;
    updates: UpdateRule[];
}

/* TOOL TRIGGER */
export interface ToolTriggerConfig {
    tool: "EMAIL_ALERT" | "CHECK_INVENTORY" | "CREATE_SHIPMENT";
    params?: Record<string, any>;
}
