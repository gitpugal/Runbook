"use client";

import { DatabaseContext } from "@/app/context/DatabaseContext";
import { Funnel } from "lucide-react";
import { useContext } from "react";
import {
    Handle,
    Position,
    NodeProps,
} from "reactflow";
import { WorkflowNodeData } from "../types/workflow";

const TYPE_STYLES: Record<
    string,
    { border: string; glow: string; badge: string }
> = {
    DATA_FETCH: {
        border: "border-cyan-500/40",
        glow: "shadow-cyan-500/20",
        badge: "bg-cyan-500/10 text-cyan-300",
    },
    CONDITION: {
        border: "border-yellow-500/40",
        glow: "shadow-yellow-500/20",
        badge: "bg-yellow-500/10 text-yellow-300",
    },
    DATA_UPDATE: {
        border: "border-green-500/40",
        glow: "shadow-green-500/20",
        badge: "bg-green-500/10 text-green-300",
    },
    TOOL_TRIGGER: {
        border: "border-purple-500/40",
        glow: "shadow-purple-500/20",
        badge: "bg-purple-500/10 text-purple-300",
    },
    DATA_TRIGGER: {
        border: "border-blue-500/40",
        glow: "shadow-blue-500/20",
        badge: "bg-blue-500/10 text-blue-300",
    },
    WEBHOOK_TRIGGER: {
        border: "border-sky-500/40",
        glow: "shadow-sky-500/20",
        badge: "bg-sky-500/10 text-sky-300",
    },
    JOIN: {
        border: "border-emerald-500/40",
        glow: "shadow-emerald-500/20",
        badge: "bg-emerald-500/10 text-emerald-300",
    },
    LOOP: {
        border: "border-orange-500/40",
        glow: "shadow-orange-500/20",
        badge: "bg-orange-500/10 text-orange-300",
    },
};

const handleBase: React.CSSProperties = {
    width: 10,
    height: 10,
    borderRadius: "999px",
    border: "2px solid #0f172a",
};

export default function WorkflowNode(
    props: NodeProps<WorkflowNodeData>
) {
    const { id, data } = props;
    const { currentNode } = useContext(DatabaseContext);

    const styles = TYPE_STYLES[data.type] ?? TYPE_STYLES.DATA_FETCH;
    const isRunning = currentNode === id;

    return (
        <div
            className={`
                relative min-w-[180px]
                rounded-xl
                border
                bg-gradient-to-b from-[#0f172a] to-[#0b1220]
                px-4 py-3
                backdrop-blur-sm
                transition-all duration-300
                ${styles.border}
                ${styles.glow}
${isRunning ? "animate-[glowBreath_2s_ease-in-out_infinite]" : ""}

            `}
        >
            {isRunning && (
                <>
                    {/* Animated Glow Background */}
                    <div className="absolute inset-0 rounded-xl bg-green-500/10 blur-2xl animate-pulse pointer-events-none" />

                    {/* Expanding Ring Effect */}
                    <div className="absolute inset-0 rounded-xl border-2 border-green-400 animate-[ping_1.5s_infinite] opacity-40 pointer-events-none" />
                </>
            )}

            {/* Running Indicator Dot */}
            {isRunning && (
                <div className="absolute -top-2 -right-2 flex items-center gap-1">
                    <span className="h-6 w-6 rounded-full bg-green-400 animate-ping absolute"></span>
                    <span className="h-6 w-6 rounded-full bg-green-400 relative"></span>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold text-white tracking-tight">
                    {data.type === "DATA_FETCH" ||
                        data.type === "DATA_UPDATE"
                        ? data.config.table || "Select table"
                        : data.type === "LOOP"
                            ? data.config.sourceNode || "Select source"
                        : data.type === "CONDITION"
                            ? (
                                <Funnel
                                    size={16}
                                    className="text-yellow-400"
                                />
                            )
                            : data.label}
                </div>

                <div
                    className={`text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider font-medium ${styles.badge}`}
                >
                    {data.type.replace("_", " ")}
                </div>
            </div>

            {/* Input Handle */}
            <Handle
                type="target"
                position={Position.Top}
                style={{
                    ...handleBase,
                    background: "#60a5fa",
                }}
            />

            {/* Output Handles */}
            {data.type === "CONDITION" ? (
                <>
                    <Handle
                        type="source"
                        position={Position.Bottom}
                        id="true"
                        style={{
                            ...handleBase,
                            left: "30%",
                            background: "#22c55e",
                        }}
                    />
                    <Handle
                        type="source"
                        position={Position.Bottom}
                        id="false"
                        style={{
                            ...handleBase,
                            left: "70%",
                            background: "#ef4444",
                        }}
                    />

                    <div className="absolute -bottom-5 left-[30%] -translate-x-1/2 text-[9px] text-green-400 font-medium">
                        True
                    </div>
                    <div className="absolute -bottom-5 left-[70%] -translate-x-1/2 text-[9px] text-red-400 font-medium">
                        False
                    </div>
                </>
            ) : (
                <>
                    <Handle
                        type="source"
                        position={Position.Bottom}
                        id="success"
                        style={{
                            ...handleBase,
                            left: "24%",
                            background: "#22c55e",
                        }}
                    />
                    <Handle
                        type="source"
                        position={Position.Bottom}
                        style={{
                            ...handleBase,
                            background: "#e2e8f0",
                        }}
                    />
                    <Handle
                        type="source"
                        position={Position.Bottom}
                        id="failure"
                        style={{
                            ...handleBase,
                            left: "76%",
                            background: "#ef4444",
                        }}
                    />
                    <div className="absolute -bottom-5 left-[24%] -translate-x-1/2 text-[9px] text-green-400 font-medium">
                        Success
                    </div>
                    <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-slate-300 font-medium">
                        Default
                    </div>
                    <div className="absolute -bottom-5 left-[76%] -translate-x-1/2 text-[9px] text-red-400 font-medium">
                        Failure
                    </div>
                </>
            )}
        </div>
    );
}
