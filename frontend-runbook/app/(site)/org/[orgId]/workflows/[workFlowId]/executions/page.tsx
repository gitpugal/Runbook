"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import JSONPretty from "react-json-pretty";
import { Clock, Zap } from "lucide-react";

type ExecutionSummary = {
    id: string;
    status: string;
    triggerType: string;
    startedAt: string | null;
};

type NodeExecution = {
    id: string;
    nodeId: string;
    status: string;
    startedAt: string | null;
    inputJson?: string | null;
    outputJson?: string | null;
};

type ExecutionDetail = {
    id: string;
    status: string;
    triggerType: string;
    nodes: NodeExecution[];
};

export default function WorkflowExecutionsPage() {
    const { workFlowId, orgId } = useParams<{ workFlowId: string; orgId: string }>();
    const router = useRouter();

    const [executions, setExecutions] = useState<ExecutionSummary[]>([]);
    const [selectedExecution, setSelectedExecution] = useState<ExecutionDetail | null>(null);
    const [selectedNode, setSelectedNode] = useState<NodeExecution | null>(null);

    function parseJson(json?: string | null) {
        if (!json) return {};
        try {
            return JSON.parse(json);
        } catch {
            return { raw: json };
        }
    }

    function getRunTypeUI(type: string) {
        if (type === "SCHEDULED") {
            return {
                label: "Scheduled",
                icon: Clock,
                color: "text-blue-400",
                badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
                border: "border-l-blue-500"
            };
        }

        return {
            label: "Quick Run",
            icon: Zap,
            color: "text-amber-400",
            badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
            border: "border-l-amber-500"
        };
    }

    async function loadExecution(executionId: string) {
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_SPRING_API_ENDPOINT}/workflow/executions/${executionId}`
        );

        const execution = await res.json();
        setSelectedExecution(execution);
        setSelectedNode(null);
    }

    useEffect(() => {
        fetch(
            `${process.env.NEXT_PUBLIC_SPRING_API_ENDPOINT}/workflow/${workFlowId}/executions`
        )
            .then((res) => res.json())
            .then((data) => {
                setExecutions(data);
                if (data[0]) loadExecution(data[0].id);
            });
    }, [workFlowId]);

    const formatDate = (value?: string | null) =>
        value ? new Date(value).toLocaleString() : "Running";

    const statusColor = (status: string) => {
        if (status === "SUCCESS") return "bg-emerald-500";
        if (status === "FAILED") return "bg-red-500";
        return "bg-yellow-500";
    };

    return (
        <div className="flex h-screen overflow-hidden bg-[#0b0f19] text-white">

            {/* SIDEBAR RUNS */}

            <div className="w-[260px] border-r border-white/10 flex flex-col min-h-0">

                <div className="p-4 text-xs uppercase text-slate-400">
                    Workflow Runs
                </div>

                <div className="flex-1 overflow-y-auto px-4 pb-4">

                    {executions.map((run) => {
                        const runType = getRunTypeUI(run.triggerType);
                        const Icon = runType.icon;

                        return (
                            <div
                                key={run.id}
                                onClick={() => loadExecution(run.id)}
                                className={`cursor-pointer rounded-xl border border-white/10 border-l-4 ${runType.border} p-3 mb-3 hover:border-white/30 transition`}
                            >

                                <div className="flex items-center justify-between">

                                    {/* RUN TYPE */}

                                    <div className="flex items-center gap-2 text-sm font-medium">

                                        <Icon className={`h-4 w-4 ${runType.color}`} />

                                        {/* <span>{runType.label}</span> */}

                                        <span
                                            className={`text-[10px] px-2 py-[2px] rounded-md border ${runType.badge}`}
                                        >
                                            {run.triggerType}
                                        </span>

                                    </div>

                                    {/* STATUS */}

                                    <div className="flex items-center gap-1 text-[7px]">

                                        <div
                                            className={`h-2 w-2 rounded-full ${statusColor(run.status)}`}
                                        />

                                        {run.status}

                                    </div>
                                </div>

                                <div className="text-xs text-slate-400 mt-1">
                                    {formatDate(run.startedAt)}
                                </div>

                            </div>
                        );
                    })}

                </div>
            </div>

            {/* MAIN EXECUTION AREA */}

            <div className="flex-1 flex flex-col min-h-0">

                {/* HEADER */}

                <div className="flex items-center justify-between border-b border-white/10 p-6">

                    <div>

                        <div className="text-xs uppercase text-slate-400">
                            Execution Viewer
                        </div>

                        <div className="text-2xl font-semibold">
                            {selectedExecution?.triggerType || "Select a Run"}
                        </div>

                    </div>

                    <Button
                        variant="outline"
                        onClick={() =>
                            router.push(`/org/${orgId}/workflows/${workFlowId}`)
                        }
                    >
                        Back To Builder
                    </Button>

                </div>

                {/* TIMELINE */}

                <div className="flex-1 min-h-0 overflow-y-auto p-8 pb-40">

                    <div className="max-w-3xl mx-auto space-y-6">

                        {selectedExecution?.nodes?.map((node, i) => (
                            <div
                                key={node.id}
                                className="flex items-start gap-4 cursor-pointer"
                                onClick={() => setSelectedNode(node)}
                            >

                                {/* TIMELINE DOT */}

                                <div className="flex flex-col items-center">

                                    <div
                                        className={`h-4 w-4 rounded-full ${statusColor(node.status)}`}
                                    />

                                    {i !== selectedExecution.nodes.length - 1 && (
                                        <div className="w-[2px] bg-white/10 h-12 mt-1" />
                                    )}

                                </div>

                                {/* NODE CARD */}

                                <div className="flex-1 rounded-xl border border-white/10 p-4 hover:border-white/30 transition">

                                    <div className="flex justify-between">

                                        <div className="font-medium">
                                            {node.nodeId}
                                        </div>

                                        <div className="text-xs text-slate-400">
                                            {node.status}
                                        </div>

                                    </div>

                                    <div className="text-xs text-slate-400 mt-1">
                                        {formatDate(node.startedAt)}
                                    </div>

                                </div>

                            </div>
                        ))}

                    </div>

                </div>

            </div>

            {/* NODE INSPECTOR */}

            {selectedNode && (

                <div className="w-[460px] border-l border-white/10 bg-[#0f1525] flex flex-col min-h-0">

                    <div className="flex items-center justify-between p-6 border-b border-white/10">

                        <div className="text-lg font-semibold">
                            Node Detail
                        </div>

                        <button
                            onClick={() => setSelectedNode(null)}
                            className="text-sm text-slate-400 hover:text-white"
                        >
                            Close
                        </button>

                    </div>

                    <div className="flex-1 overflow-y-auto p-6 pb-40">

                        <div className="text-sm text-slate-400 mb-6 break-all">
                            {selectedNode.nodeId}
                        </div>

                        {/* INPUT */}

                        <div className="mb-6">

                            <div className="text-xs uppercase text-slate-400 mb-2">
                                Input
                            </div>

                            <div className="bg-black/30 rounded-lg p-3 text-xs overflow-auto max-h-[320px]">

                                <JSONPretty
                                    data={parseJson(selectedNode.inputJson)}
                                />

                            </div>

                        </div>

                        {/* OUTPUT */}

                        <div>

                            <div className="text-xs uppercase text-slate-400 mb-2">
                                Output
                            </div>

                            <div className="bg-black/30 rounded-lg p-3 text-xs overflow-auto max-h-[320px]">

                                <JSONPretty
                                    data={parseJson(selectedNode.outputJson)}
                                />

                            </div>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}