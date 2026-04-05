// "use client";

// import React, {
//     forwardRef,
//     useImperativeHandle,
//     useState,
// } from "react";
// import ReactFlow, {
//     Background,
//     Controls,
//     addEdge,
//     applyNodeChanges,
//     applyEdgeChanges,
//     useReactFlow,
//     type Node,
//     type Edge,
//     type Connection,
//     type NodeChange,
//     type EdgeChange,
// } from "reactflow";
// import "reactflow/dist/style.css";

// import WorkflowNode from "./WorkFlowNode";
// import NodePropertiesDialog from "../../workflows/[workFlowId]/properties/NodePropertiesDialog";
// import { WorkflowNodeData } from "../../workflows/[workFlowId]/types/workflow";

// const NODE_TYPES = {
//     default: WorkflowNode,
// };

// export type WorkflowCanvasHandle = {
//     reorderAndFit: (nodes: Node<WorkflowNodeData>[]) => void;
// };

// const WorkflowCanvas = forwardRef<
//     WorkflowCanvasHandle,
//     {
//         nodes: Node<WorkflowNodeData>[];
//         setNodes: React.Dispatch<
//             React.SetStateAction<Node<WorkflowNodeData>[]>
//         >;
//         edges: Edge[];
//         setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
//     }
// >(function WorkflowCanvas(
//     { nodes, setNodes, edges, setEdges },
//     ref
// ) {
//     const { fitView } = useReactFlow();
//     const [selectedNodeId, setSelectedNodeId] =
//         useState<string | null>(null);

//     const selectedNode = nodes.find((n) => n.id === selectedNodeId);

//     /* ---------- REQUIRED handlers ---------- */

//     const onNodesChange = (changes: NodeChange[]) =>
//         setNodes((nds) => applyNodeChanges(changes, nds));

//     const onEdgesChange = (changes: EdgeChange[]) =>
//         setEdges((eds) => applyEdgeChanges(changes, eds));

//     /* ---------- expose reorder + fit ---------- */

//     useImperativeHandle(ref, () => ({
//         reorderAndFit(newNodes) {
//             setNodes(newNodes);
//             requestAnimationFrame(() => {
//                 fitView({ padding: 0.25, duration: 600 });
//             });
//         },
//     }));

//     /* ---------- drag & drop ---------- */

//     const onDragOver = (e: React.DragEvent) => {
//         e.preventDefault();
//         e.dataTransfer.dropEffect = "move";
//     };

//     const onDrop = (e: React.DragEvent) => {
//         e.preventDefault();

//         const type = e.dataTransfer.getData("nodeType") as
//             | WorkflowNodeData["type"]
//             | "";

//         if (!type) return;
//         e.dataTransfer.clearData();

//         const bounds = e.currentTarget.getBoundingClientRect();
//         const position = {
//             x: e.clientX - bounds.left,
//             y: e.clientY - bounds.top,
//         };

//         const newNode: Node<WorkflowNodeData> = {
//             id: crypto.randomUUID(),
//             type: "default",
//             position,
//             data: {
//                 type,
//                 label: type.replace("_", " "),
//                 config:
//                     type === "DATA_FETCH"
//                         ? { table: "", filters: [] }
//                         : type === "CONDITION"
//                             ? { filters: [] }
//                             : type === "DATA_UPDATE"
//                                 ? { table: "", updates: [] }
//                                 : { tool: "" },
//             },
//         };

//         setNodes((nds) => [...nds, newNode]);
//     };

//     return (
//         <div className="h-full w-full">
//             <ReactFlow
//                 className="h-full w-full"
//                 nodes={nodes}
//                 edges={edges}
//                 nodeTypes={NODE_TYPES}
//                 onNodesChange={onNodesChange}
//                 onEdgesChange={onEdgesChange}
//                 onConnect={(p: Connection) =>
//                     setEdges((eds) =>
//                         addEdge(
//                             {
//                                 ...p,
//                                 animated: true,
//                                 type: "smoothstep",
//                                 className: "neon-edge",
//                             },
//                             eds
//                         )
//                     )
//                 }
//                 onNodeClick={(e, n) => {
//                     e.stopPropagation();
//                     setSelectedNodeId(n.id);
//                 }}
//                 onDrop={onDrop}
//                 onDragOver={onDragOver}
//                 panOnDrag
//                 zoomOnScroll
//             >
//                 <Background gap={16} />
//                 <Controls />
//             </ReactFlow>

//             {selectedNode && (
//                 <NodePropertiesDialog
//                     open
//                     node={selectedNode}
//                     allNodes={nodes}
//                     edges={edges}
//                     onClose={() => setSelectedNodeId(null)}
//                     onChange={(cfg) =>
//                         setNodes((nds) =>
//                             nds.map((n) =>
//                                 n.id === selectedNode.id
//                                     ? { ...n, data: { ...n.data, config: cfg } }
//                                     : n
//                             )
//                         )
//                     }
//                 />
//             )}
//         </div>
//     );
// });

// export default WorkflowCanvas;
