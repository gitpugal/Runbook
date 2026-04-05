"use client";

import { ReactFlowProvider } from "reactflow";
import { useRef, useState } from "react";
import type { Node, Edge } from "reactflow";

import WorkflowSidebar from "./sidebar/WorkflowSidebar";
import WorkflowCanvas, {
    WorkflowCanvasHandle,
} from "./canvas/WorkflowCanvas";
import { Button } from "@/components/ui/button";
import { WorkflowNodeData } from "./types/workflow";
import { autoLayoutNodes } from "./utils/autoLayout";

export default function WorkflowBuilder() {
    const [nodes, setNodes] = useState<Node<WorkflowNodeData>[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);

    const canvasRef = useRef<WorkflowCanvasHandle>(null);

    const handleSchedule = () => {
        console.log(
            JSON.stringify(
                {
                    version: 1,
                    scheduledAt: new Date().toISOString(),
                    nodes,
                    edges,
                },
                null,
                2
            )
        );
    };

    const handleReorder = () => {
        const reordered = autoLayoutNodes(nodes, edges);
        canvasRef.current?.reorderAndFit(reordered);
    };

    return (
        <ReactFlowProvider>
            <div className="flex h-full w-full">
                {/* SIDEBAR */}
                <WorkflowSidebar />

                {/* MAIN */}
                <div className="flex flex-1 flex-col">
                    {/* TOP ACTION BAR */}
                    <div className="fixed z-10 flex gap-2 p-5">
                        <Button variant="secondary" onClick={handleReorder}>
                            Re-order
                        </Button>
                        <Button onClick={handleSchedule}>Schedule</Button>
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
            </div>
        </ReactFlowProvider>
    );
}
