"use client";

import { ReactFlowProvider } from "reactflow";
import { useContext, useEffect, useRef, useState } from "react";
import type { Node, Edge } from "reactflow";

import WorkflowSidebar from "./sidebar/WorkflowSidebar";
import { Button } from "@/components/ui/button";
import { WorkflowNodeData } from "./types/workflow";
import { autoLayoutNodes } from "./utils/autoLayout";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import WorkflowCanvas, { WorkflowCanvasHandle } from "./canvas/WorkflowCanvas";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { DatabaseContext } from "@/app/context/DatabaseContext";
import { Loader2Icon } from "lucide-react";

type WorkflowResponseData = {
    name?: string;
    definition?: string;
    database?: string | null;
    dbId?: string | null;
};

type DatabaseOption = {
    id: string;
    name: string;
    sourceType: "EXTERNAL" | "INTERNAL";
    schemaName?: string;
};

export default function WorkflowBuilder() {
    const [nodes, setNodes] = useState<Node<WorkflowNodeData>[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [data, setData] = useState<WorkflowResponseData | null>(null);
    const { data: session } = useSession();
    const { workFlowId } = useParams<{ workFlowId: string }>();
    const orgId = useParams<{ orgId: string }>().orgId;
    const router = useRouter();

    const [databases, setDatabases] = useState<DatabaseOption[]>([]);
    const [currentDatabase, setCurrentDatabase] = useState<DatabaseOption | null>(null);
    const [showDbDialog, setShowDbDialog] = useState(false);
    const { setDatabase, setCurrentNode } = useContext(DatabaseContext);
    const [isQuickRunning, setIsQuickRunning] = useState(false);


    const canvasRef = useRef<WorkflowCanvasHandle>(null);

    /* ===============================
       Load Data Sources
    =============================== */
    useEffect(() => {
        async function loadSources() {
            try {
                const [databaseResponse, internalResponse] = await Promise.all([
                    fetch(`${process.env.NEXT_PUBLIC_SPRING_API_ENDPOINT}/orgs/${orgId}/databases`),
                    fetch(`${process.env.NEXT_PUBLIC_SPRING_API_ENDPOINT}/orgs/${orgId}/internal-data/environment`),
                ]);

                const externalSources = databaseResponse.ok
                    ? ((await databaseResponse.json()) as Array<{ id: string; name: string }>).map((database) => ({
                        ...database,
                        sourceType: "EXTERNAL" as const,
                    }))
                    : [];

                const internalEnvironment = internalResponse.ok ? await internalResponse.json() : null;
                const internalSources = internalEnvironment?.schemaName
                    ? [{
                        id: `internal:${internalEnvironment.schemaName}`,
                        name: "Runbook Internal Data",
                        sourceType: "INTERNAL" as const,
                        schemaName: internalEnvironment.schemaName as string,
                    }]
                    : [];

                const sources = [...internalSources, ...externalSources];
                setDatabases(sources);

                if (sources.length > 0 && !currentDatabase) {
                    // setCurrentDatabase(sources[0]);
                    // setDatabase(sources[0].id);
                    // setShowDbDialog(false);
                    setShowDbDialog(true);
                }
                if (currentDatabase) {
                    setShowDbDialog(false);
                }
                // else if (sources.length === 0) {
                // }
            } catch (error) {
                console.error(error);
            }
        }

        loadSources();
    }, [currentDatabase, orgId, setDatabase]);

    const handleDatabaseSelect = (dbId: string) => {
        const selected = databases.find((db) => db.id === dbId);
        if (!selected) {
            toast.error("Selected database could not be found.");
            return;
        }

        setCurrentDatabase(selected);
        setDatabase(selected.id);
        setShowDbDialog(false);
        toast.success(`Using data source: ${selected?.name}`);
    };

    /* ===============================
       Save Workflow
    =============================== */
    const handleSave = () => {
        console.log("Saving workflow with nodes:", nodes, "and edges:", edges);
        fetch(
            `${process.env.NEXT_PUBLIC_SPRING_API_ENDPOINT}/workflow/${workFlowId}/save`,
            {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nodes,
                    edges,
                    name: data?.name,
                    email: session?.user?.email || "",
                    orgDatabaseId: currentDatabase?.sourceType === "EXTERNAL" ? currentDatabase.id : null,
                }),
            }
        )
            .then((res) => {
                if (!res.ok) throw new Error("Failed to save workflow");
                toast.success("Workflow saved");
            })
            .catch(() => toast.error("Save failed"));
    };

    /* ===============================
       Reorder Nodes
    =============================== */
    const handleReorder = () => {
        const reordered = autoLayoutNodes(nodes, edges);
        canvasRef.current?.reorderAndFit(reordered);
    };

    /* ===============================
       Load Workflow Definition
    =============================== */
    useEffect(() => {
        if (!workFlowId) return;

        async function fetchWorkflow() {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_SPRING_API_ENDPOINT}/workflow/${workFlowId}`
            );

            if (!res.ok) {
                const err = await res.json();
                toast.error("Failed to load workflow", {
                    description: err.message || "Unknown error",
                });
                return;
            }

            const workflow: WorkflowResponseData = await res.json();
            console.log("Loaded workflow:", workflow);
            setData(workflow);

            if (!workflow.definition) return;

            const definition = JSON.parse(workflow.definition);

            if (!definition?.nodes || !definition?.edges) return;

            setNodes(definition.nodes);
            setEdges(definition.edges);

            // Optional: preload DB from backend
            if (workflow.database && workflow.dbId) {
                setCurrentDatabase({ name: workflow.database, id: workflow.dbId, sourceType: "EXTERNAL" });
                setDatabase(workflow.dbId);
                setShowDbDialog(false);
            } else if (workflow.definition) {
                const internalNode = (definition.nodes as Array<{ data?: { config?: { schema?: string } } }>).find((node) => {
                    const schema = node?.data?.config?.schema;
                    return typeof schema === "string" && schema.startsWith("runbook_org_");
                });

                if (internalNode?.data?.config?.schema) {
                    const internalSource = {
                        id: `internal:${internalNode.data.config.schema}`,
                        name: "Runbook Internal Data",
                        sourceType: "INTERNAL" as const,
                        schemaName: internalNode.data.config.schema as string,
                    };
                    setCurrentDatabase(internalSource);
                    setDatabase(internalSource.id);
                    setShowDbDialog(false);
                }
            }
        }


        fetchWorkflow();
    }, [setDatabase, workFlowId]);




    /* ===============================
        Quick Run (Corrected Flow)
     =============================== */
    const handleQuickRun = async () => {

        setIsQuickRunning(true);

        // 1️⃣ Generate executionId on frontend
        const executionId = crypto.randomUUID();

        // 2️⃣ Connect SSE FIRST
        const eventSource = new EventSource(
            `${process.env.NEXT_PUBLIC_SPRING_API_ENDPOINT}/workflow/executions/${executionId}/events`
        );

        eventSource.addEventListener("NODE_STARTED", (event) => {
            const data = JSON.parse(event.data);
            setCurrentNode(data.nodeId);
        });

        eventSource.addEventListener("NODE_COMPLETED", () => {
            setCurrentNode(null);
        });

        eventSource.addEventListener("WORKFLOW_COMPLETED", () => {
            toast.success("Workflow completed");
            setCurrentNode(null);
            setIsQuickRunning(false);
            eventSource.close();
        });

        eventSource.addEventListener("WORKFLOW_FAILED", () => {
            toast.error("Workflow failed");
            setCurrentNode(null);
            setIsQuickRunning(false);
            eventSource.close();
        });

        eventSource.onerror = () => {
            setIsQuickRunning(false);
            eventSource.close();
        };

        // 3️⃣ THEN call run API
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_SPRING_API_ENDPOINT}/workflow/${workFlowId}/run?executionId=${executionId}&isQuick=true`,
        );

        if (!res.ok) {
            toast.error("Failed to start execution");
            setIsQuickRunning(false);
            eventSource.close();
        }
    };


    return (
        <ReactFlowProvider>

            <div className="flex h-full w-full">

                {/* SIDEBAR */}
                <WorkflowSidebar
                    session={session}
                    data={data}
                    setData={setData}
                />

                {/* MAIN */}
                <div className="flex flex-1 flex-col ">

                    {/* MODERN TOP BAR */}
                    <div className=" z-10 flex relative w-full items-center justify-between px-6 py-4 backdrop-blur-md bg-white/5 border-b">

                        {/* LEFT ACTIONS */}
                        <div className="flex gap-2">
                            {/* <AIGenerateWorkflowDialog
                                currentNodes={nodes}
                                onApply={handleApplyGeneratedWorkflow}
                            /> */}

                            <Button
                                variant="secondary"
                                onClick={handleReorder}
                            >
                                Re-order
                            </Button>

                            <Button
                                onClick={handleSave}
                                disabled={!currentDatabase}
                            >
                                Save
                            </Button>

                            {/* <Button
                                onClick={handleRun}
                                disabled={!currentDatabase}
                            >
                                Run
                            </Button> */}
                            <Button
                                onClick={handleQuickRun}
                                disabled={!currentDatabase || isQuickRunning}
                            >
                                {isQuickRunning ? <Loader2Icon className="animate-spin" /> : "Quick Run"}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => router.push(`/org/${orgId}/workflows/${workFlowId}/executions`)}
                            >
                                Executions
                            </Button>
                        </div>

                        {/* RIGHT DB INDICATOR */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-1 text-sm shadow-sm">
                                <span className="h-2 w-2 rounded-full bg-green-500"></span>

                                {currentDatabase ? (
                                    <span className="font-medium">
                                        {currentDatabase.name}
                                    </span>
                                ) : (
                                    <span className="text-muted-foreground">
                                        No database selected
                                    </span>
                                )}
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowDbDialog(true)}
                            >
                                {currentDatabase ? "Change" : "Select"}
                            </Button>
                        </div>
                    </div>

                    {/* CANVAS */}
                    <div className="flex-1 h-full">
                        <WorkflowCanvas
                            ref={canvasRef}
                            nodes={nodes}
                            setNodes={setNodes}
                            edges={edges}
                            setEdges={setEdges}
                        />
                    </div>
                </div>

                {/* DATABASE SELECTION DIALOG */}
                <Dialog
                    open={showDbDialog}
                    onOpenChange={setShowDbDialog}
                >
                    <DialogContent
                        className="sm:max-w-md"
                        onInteractOutside={(e) => {
                            if (!currentDatabase) e.preventDefault();
                        }}
                        onEscapeKeyDown={(e) => {
                            if (!currentDatabase) e.preventDefault();
                        }}
                    >
                        <DialogHeader>
                            <DialogTitle>Select Data Source</DialogTitle>
                            <DialogDescription>
                                Choose the data source this workflow should use.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="mt-4">
                            <Select
                                value={currentDatabase?.id}
                                onValueChange={handleDatabaseSelect}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose a data source" />
                                </SelectTrigger>
                                <SelectContent>
                                    {databases.map((db) => (
                                        <SelectItem
                                            key={db.id}
                                            value={db.id}
                                        >
                                            {db.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </ReactFlowProvider>
    );
}
