"use client";

import { useMemo, useState } from "react";
import type { Edge, Node } from "reactflow";
import { WandSparkles, Loader2Icon, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { WorkflowNodeData } from "../types/workflow";
import { autoLayoutNodes } from "../utils/autoLayout";
import { WorkflowDefinition } from "@/lib/workflow-generator";

type BuilderNode = Node<WorkflowNodeData>;

function getDefaultConfig(type: WorkflowNodeData["type"]) {
    if (type === "DATA_FETCH") {
        return { table: "", filters: [], retryCount: 0, retryDelay: 0, timeoutSeconds: 30 };
    }

    if (type === "CONDITION") {
        return { filters: [], aggregation: "ANY", retryCount: 0, retryDelay: 0, timeoutSeconds: 30 };
    }

    if (type === "DATA_UPDATE") {
        return { table: "", updates: [], filters: [], usePreviousFilter: false, retryCount: 0, retryDelay: 0, timeoutSeconds: 30 };
    }

    if (type === "TOOL_TRIGGER") {
        return { toolName: "http_tool", payload: "", includePrevious: false, retryCount: 0, retryDelay: 0, timeoutSeconds: 30 };
    }

    if (type === "LOOP") {
        return { sourceNode: "", retryCount: 0, retryDelay: 0, timeoutSeconds: 30 };
    }

    return { retryCount: 0, retryDelay: 0, timeoutSeconds: 30 };
}

function normalizeWorkflowDefinition(definition: WorkflowDefinition) {
    const nodes: BuilderNode[] = definition.nodes.map((node, index) => {
        const nodeType = node.data.type as WorkflowNodeData["type"];

        return {
            id: node.id,
            type: "default",
            position: {
                x: (index % 3) * 260,
                y: Math.floor(index / 3) * 140,
            },
            data: {
                label: node.data.label || node.type.replaceAll("_", " "),
                type: nodeType,
                config: {
                    ...getDefaultConfig(nodeType),
                    ...node.data.config,
                },
            },
        };
    });

    const edges: Edge[] = definition.edges.map((edge) => ({
        id: `${edge.source}-${edge.target}-${edge.label ?? "default"}`,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        sourceHandle: edge.label === "true" || edge.label === "false" ? edge.label : null,
        animated: true,
        type: "smoothstep",
        className: "neon-edge",
    }));

    return {
        nodes: autoLayoutNodes(nodes, edges),
        edges,
    };
}

export default function AIGenerateWorkflowDialog({
    currentNodes,
    onApply,
}: {
    currentNodes: BuilderNode[];
    onApply: (workflow: { nodes: BuilderNode[]; edges: Edge[] }) => void;
}) {
    const [open, setOpen] = useState(false);
    const [prompt, setPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

    const hasExistingCanvas = currentNodes.length > 0;
    const promptExamples = useMemo(
        () => [
            "When a webhook arrives, fetch pending invoices, check if amount is greater than 5000, send Slack for high-value invoices, otherwise mark them for auto-approval.",
            "Start on a data trigger, fetch org invites where accepted is false, send reminder emails, then update reminder_sent to true.",
        ],
        []
    );

    async function handleGenerate() {
        if (!prompt.trim()) {
            toast.error("Enter an automation description first.");
            return;
        }

        try {
            setIsGenerating(true);

            const response = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message: prompt.trim(),
                }),
            });

            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload?.error || "Failed to generate workflow");
            }

            const normalized = normalizeWorkflowDefinition(payload as WorkflowDefinition);
            onApply(normalized);
            setOpen(false);
            toast.success("Workflow generated and loaded into the canvas.");
        } catch (error) {
            toast.error("Workflow generation failed", {
                description: error instanceof Error ? error.message : "Unknown error",
            });
        } finally {
            setIsGenerating(false);
        }
    }

    return (
        <>
            <Button
                variant="outline"
                onClick={() => setOpen(true)}
            >
                <WandSparkles />
                Generate with AI
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-2xl border-white/10 bg-[#050b17] text-white h-[90vh] overflow-y-scroll">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-white">
                            <Sparkles className="text-indigo-300" size={18} />
                            Generate workflow from plain English
                        </DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Describe the automation you want and Runbook will generate a starter workflow JSON for this canvas.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                Automation description
                            </div>
                            <textarea
                                value={prompt}
                                onChange={(event) => setPrompt(event.target.value)}
                                placeholder="Example: When a webhook payload contains a new support escalation, fetch the ticket, check if priority is critical, send Slack to the incident channel, and update the row as triaged."
                                className="min-h-40 w-full rounded-lg border border-white/10 bg-black/30 p-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-400/50"
                            />
                        </div>

                        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                Example prompts
                            </div>
                            <div className="space-y-2">
                                {promptExamples.map((example) => (
                                    <button
                                        key={example}
                                        type="button"
                                        onClick={() => setPrompt(example)}
                                        className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-3 text-left text-sm text-slate-300 transition hover:border-white/20 hover:bg-white/[0.06]"
                                    >
                                        {example}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {hasExistingCanvas && (
                            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                                Generating a new workflow will replace the current nodes and edges in this canvas.
                            </div>
                        )}
                    </div>

                    <DialogFooter className="gap-2 sm:justify-between">
                        <Button
                            variant="ghost"
                            onClick={() => setOpen(false)}
                            disabled={isGenerating}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleGenerate}
                            disabled={isGenerating || !prompt.trim()}
                        >
                            {isGenerating ? <Loader2Icon className="animate-spin" /> : <WandSparkles />}
                            {isGenerating ? "Generating..." : "Generate workflow"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
