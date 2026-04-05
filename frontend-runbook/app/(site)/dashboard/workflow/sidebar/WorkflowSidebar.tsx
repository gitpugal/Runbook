"use client";

const NODE_TYPES = [
    {
        type: "DATA_FETCH",
        label: "Data Fetch",
        description: "Read data from a table",
    },
    {
        type: "CONDITION",
        label: "Condition",
        description: "Filter rows from previous node",
    },
    {
        type: "DATA_UPDATE",
        label: "Data Update",
        description: "Update rows in a table",
    },
    {
        type: "TOOL_TRIGGER",
        label: "Tool Trigger",
        description: "Invoke server-side action",
    },
];

export default function WorkflowSidebar() {
    const onDragStart = (event: React.DragEvent, nodeType: string) => {
        event.dataTransfer.setData("nodeType", nodeType);
        event.dataTransfer.effectAllowed = "move";
    };

    return (
        <aside className="w-64 border-r border-white/10 bg-[#050b17] p-4 text-white">
            <h3 className="mb-3 text-sm font-medium text-white/70">
                Workflow Nodes
            </h3>

            <div className="space-y-2">
                {NODE_TYPES.map((node) => (
                    <div
                        key={node.type}
                        draggable
                        onDragStart={(e) => onDragStart(e, node.type)}
                        className="cursor-grab rounded-md border border-white/10 bg-white/5 p-3 transition hover:bg-white/10 active:cursor-grabbing"
                    >
                        <div className="text-sm font-medium">{node.label}</div>
                        <div className="mt-1 text-xs text-white/50">
                            {node.description}
                        </div>
                    </div>
                ))}
            </div>
        </aside>
    );
}
