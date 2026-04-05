export type WorkflowNodeType =
    | "DATA_FETCH"
    | "CONDITION"
    | "FILTER"
    | "DATA_UPDATE"
    | "TOOL_TRIGGER"
    | "DATA_TRIGGER"
    | "JOIN"
    | "LOOP"
    | "WEBHOOK_TRIGGER";

export interface WorkflowNodeData {
    type: WorkflowNodeType;
    label: string;
    config: {
        retryCount?: number;
        retryDelay?: number;
        timeoutSeconds?: number;
        [key: string]: any;
    };
}

// app/workflow/types/workflow.ts

export type StepType =
  | "DATA_FETCH"
  | "CONDITION"
  | "FILTER"
  | "DATA_UPDATE"
  | "TOOL_TRIGGER"
  | "DATA_TRIGGER"
  | "JOIN"
  | "LOOP"
  | "WEBHOOK_TRIGGER";

export type BaseStep = {
  id: string;
  type: StepType;
  config: any;
};

export type LinearStep = BaseStep & {
  next?: WorkflowStep;
};

export type ConditionStep = BaseStep & {
  type: "CONDITION";
  branches: {
    yes: WorkflowStep;
    no: WorkflowStep;
  };
};

export type WorkflowStep = LinearStep | ConditionStep;
