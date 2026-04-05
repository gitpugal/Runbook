"use client";

import { Funnel } from "lucide-react";
import { useEffect } from "react";
import { Handle, Position } from "reactflow";

type WorkflowNodeProps = {
    data: {
        type: "DATA_FETCH" | "CONDITION" | "DATA_UPDATE" | "TOOL_TRIGGER";
        label: string;
        config: any;
        id: string;
    };
};

const TYPE_COLORS: Record<string, string> = {
    DATA_FETCH: "border-cyan-400 text-cyan-300",
    CONDITION: "border-yellow-400 text-yellow-300",
    DATA_UPDATE: "border-green-400 text-green-300",
    TOOL_TRIGGER: "border-purple-400 text-purple-300",
    DATA_TRIGGER: "border-blue-400 text-blue-300",};
const baseHandleStyle: React.CSSProperties = {
    width: 12,
    height: 12,
    borderRadius: "50%",
    border: "2px solid #0b1220",
    boxShadow: "0 0 0 2px rgba(255,255,255,0.08)",
};

const singleOutputStyle: React.CSSProperties = {
    ...baseHandleStyle,
    background: "#e5e7eb", // soft light
};

const trueHandleStyle: React.CSSProperties = {
    ...baseHandleStyle,
    left: "30%",
    background: "#22c55e", // modern green
    boxShadow: "0 0 8px rgba(34,197,94,0.6)",
};

const falseHandleStyle: React.CSSProperties = {
    ...baseHandleStyle,
    left: "70%",
    background: "#ef4444", // modern red
    boxShadow: "0 0 8px rgba(239,68,68,0.6)",
};

const inputHandleStyle: React.CSSProperties = {
    ...baseHandleStyle,
    background: "#60a5fa", // subtle blue input
    boxShadow: "0 0 6px rgba(96,165,250,0.6)",
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

            {/* Input Handle */}
            <Handle
                type="target"
                position={Position.Top}
                style={inputHandleStyle}
            />

            {/* Output Handles */}
            {data.type === "CONDITION" ? (
                <div className="relative mt-2 h-6 w-full">
                    {/* TRUE Label */}
                    <div
                        className="absolute -bottom-5 text-[10px] font-medium text-green-400"
                        style={{ left: "30%", transform: "translateX(-50%)" }}
                    >
                        True
                    </div>

                    {/* FALSE Label */}
                    <div
                        className="absolute -bottom-5 text-[10px] font-medium text-red-400"
                        style={{ left: "70%", transform: "translateX(-50%)" }}
                    >
                        False
                    </div>

                    {/* TRUE Handle */}
                    <Handle
                        type="source"
                        position={Position.Bottom}
                        id="true"
                        style={trueHandleStyle}
                    />

                    {/* FALSE Handle */}
                    <Handle
                        type="source"
                        position={Position.Bottom}
                        id="false"
                        style={falseHandleStyle}
                    />
                </div>
            ) : (
                <Handle
                    type="source"
                    position={Position.Bottom}
                    style={singleOutputStyle}
                />
            )}


        </div>
    );
}
