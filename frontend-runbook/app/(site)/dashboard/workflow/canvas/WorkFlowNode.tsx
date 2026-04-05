"use client";

import { Funnel } from "lucide-react";
import { useEffect } from "react";
import { Handle, Position } from "reactflow";

type WorkflowNodeProps = {
    data: {
        type: "DATA_FETCH" | "CONDITION" | "DATA_UPDATE" | "TOOL_TRIGGER";
        label: string;
        config: any;
    };
    
};

const TYPE_COLORS: Record<string, string> = {
    DATA_FETCH: "border-cyan-400 text-cyan-300",
    CONDITION: "border-yellow-400 text-yellow-300",
    DATA_UPDATE: "border-green-400 text-green-300",
    TOOL_TRIGGER: "border-purple-400 text-purple-300",
    DATA_TRIGGER: "border-blue-400 text-blue-300",
};

export default function WorkflowNode({ data }: WorkflowNodeProps) {
    useEffect(() => {
        console.log("Node data:", data);
    }, []);
    return (
        <div
            className={`w-full rounded-lg border bg-[#0b1220] px-3 py-2 text-xs shadow-md ${TYPE_COLORS[data.type]
                }`}
        >
            {/* Header */}
            <div className="mb-1 text-sm font-medium text-white">
                {
                    data.type == "DATA_FETCH" || data.type == "DATA_UPDATE"
                        ? `${data.config.table || "Select table"}`
                        : (data.type == "CONDITION" ? <Funnel className="mx-auto text-yellow-300" />
                            : data.label)
                }
            </div>

            {/* Type badge */}
            <div className="text-[10px] uppercase opacity-70">
                {data.type.replace("_", " ")}
            </div>

            {/* Handles */}
            <Handle type="target" position={Position.Top} />
            <Handle type="source" position={Position.Bottom} />
        </div>
    );
}
