"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";

import { Node, Edge, useReactFlow } from "reactflow";
import { useContext, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { TableSchema } from "../schema/tableSchemas";
import { DatabaseContext } from "@/app/context/DatabaseContext";

export default function NodePropertiesDialog({
    open,
    node,
    allNodes,
    edges,
    onClose,
    onChange,
}: {
    open: boolean;
    node: Node<any> | undefined;
    allNodes: Node[];
    edges: Edge[];
    onClose: () => void;
    onChange: (cfg: any) => void;
}) {
    if (!node) return null;
    const isDataUpdate = node.data.type === "DATA_UPDATE";
    const usePreviousFilter = node.data.config.usePreviousFilter || false;
    const { orgId, workFlowId } = useParams<{ orgId: string; workFlowId: string }>();
    const { deleteElements } = useReactFlow();

    const handleDeleteNode = (nodeId: string) => {
        deleteElements({ nodes: [{ id: nodeId }] });
    };

    const [databases, setDatabases] = useState<any[]>([]);
    const [tables, setTables] = useState<string[]>([]);
    const [schema, setSchema] = useState<TableSchema | null>(null);
    const { database } = useContext(DatabaseContext);

    const isCondition = node.data.type === "CONDITION";
    const isLoop = node.data.type === "LOOP";
    const isDataTrigger = node.data.type === "DATA_TRIGGER";
    const isWebhookTrigger = node.data.type === "WEBHOOK_TRIGGER";
    const isInternalSource = database?.startsWith("internal:");
    const [internalSchemaName, setInternalSchemaName] = useState<string>(node.data.config.schema || "");

    const incomingEdge = edges.find((e) => e.target === node.id);
    const prevNode = allNodes.find((n) => n.id === incomingEdge?.source);
    // get database from useContext;
    // const database = database;

    const selectedTable = (isCondition || isDataUpdate && usePreviousFilter)
        ? prevNode?.data.config?.table
        : node.data.config?.table;

    const filters: any[] = node.data.config.filters || [];
    const updates: any[] = node.data.config.updates || [];
    const schemaColumns = schema?.columns || [];
    const candidateSourceNodes = allNodes.filter((candidate) => candidate.id !== node.id && candidate.data.type !== "LOOP");

    const updateConfig = (patch: any) => {
        onChange({ ...node.data.config, ...patch });
    };


    useEffect(() => {
        console.log("DB IN PROPERTIES DIALOG:", database);
    }, [database]);

    const updateFilters = (next: any[]) => updateConfig({ filters: next, table: selectedTable });
    const updateUpdates = (next: any[]) => updateConfig({ updates: next, table: selectedTable });

    useEffect(() => {
        if (!orgId) return;

        fetch(`${process.env.NEXT_PUBLIC_SPRING_API_ENDPOINT}/orgs/${orgId}/internal-data/environment`)
            .then((res) => res.ok ? res.json() : null)
            .then((environment) => {
                if (!environment?.schemaName) return;
                setInternalSchemaName(environment.schemaName);
            })
            .catch(console.error);
    }, [orgId]);

    /* ---------------- FETCH DATABASES (for DATA_FETCH & DATA_UPDATE) ---------------- */
    useEffect(() => {
        if (isCondition || isDataTrigger) return;
        fetch(`${process.env.NEXT_PUBLIC_SPRING_API_ENDPOINT}/orgs/${orgId}/databases`)
            .then(res => res.json())
            .then(setDatabases)
            .catch(console.error);
    }, [orgId, isCondition, isDataTrigger]);

    /* ---------------- FETCH TABLES ---------------- */
    useEffect(() => {
        if (isDataTrigger) {
            fetch(`${process.env.NEXT_PUBLIC_SPRING_API_ENDPOINT}/orgs/${orgId}/internal-data/meta/tables`)
                .then(res => res.json())
                .then(setTables)
                .catch(console.error);
            return;
        }

        if (!database || isCondition) return;

        setTables([]);
        setSchema(null);

        const endpoint = isInternalSource
            ? `${process.env.NEXT_PUBLIC_SPRING_API_ENDPOINT}/orgs/${orgId}/internal-data/meta/tables`
            : `${process.env.NEXT_PUBLIC_SPRING_API_ENDPOINT}/orgs/${orgId}/databases/${database}/meta/tables`;

        fetch(endpoint)
            .then(res => res.json())
            .then(setTables)
            .catch(console.error);
    }, [database, orgId, isCondition, isDataTrigger, isInternalSource]);

    /* ---------------- FETCH SCHEMA (ALL NODE TYPES THAT NEED IT) ---------------- */
    useEffect(() => {
        if (!selectedTable) return;

        const endpoint = (isInternalSource || isDataTrigger)
            ? `${process.env.NEXT_PUBLIC_SPRING_API_ENDPOINT}/orgs/${orgId}/internal-data/meta/tables/${selectedTable}/schema`
            : `${process.env.NEXT_PUBLIC_SPRING_API_ENDPOINT}/orgs/${orgId}/databases/${database}/meta/tables/${selectedTable}/schema`;

        fetch(endpoint)
            .then(res => res.json())
            .then(setSchema)
            .catch(console.error);
    }, [database, selectedTable, orgId, isInternalSource, isDataTrigger]);

    const ColumnSelect = ({ value, onChange }: any) => (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Column" />
            </SelectTrigger>
            <SelectContent>
                {schemaColumns.map((c) => (
                    <SelectItem key={c.name} value={c.name}>
                        {c.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="w-1/2 min-h-50 max-h-105 overflow-y-scroll bg-[#050b17] text-white">
                <DialogHeader>
                    <DialogTitle>{node.data.label}</DialogTitle>
                </DialogHeader>

                <div className="mt-2 rounded-lg border border-white/10 bg-white/5 p-4">
                    <div className="text-sm font-semibold">Execution Policy</div>
                    <div className="mt-3 grid grid-cols-3 gap-3">
                        <div>
                            <div className="mb-2 text-xs text-neutral-400">Retries</div>
                            <Input
                                type="number"
                                min={0}
                                value={node.data.config.retryCount ?? 0}
                                onChange={(e) => updateConfig({ retryCount: Number(e.target.value) || 0 })}
                            />
                        </div>
                        <div>
                            <div className="mb-2 text-xs text-neutral-400">Retry Delay</div>
                            <Input
                                type="number"
                                min={0}
                                value={node.data.config.retryDelay ?? 0}
                                onChange={(e) => updateConfig({ retryDelay: Number(e.target.value) || 0 })}
                            />
                        </div>
                        <div>
                            <div className="mb-2 text-xs text-neutral-400">Timeout Seconds</div>
                            <Input
                                type="number"
                                min={0}
                                value={node.data.config.timeoutSeconds ?? 30}
                                onChange={(e) => updateConfig({ timeoutSeconds: Number(e.target.value) || 0 })}
                            />
                        </div>
                    </div>
                </div>

                {/* 🚫 CONDITION WITHOUT PREVIOUS NODE */}
                {isCondition && (!prevNode || !database || !selectedTable) && (
                    <div className="mt-4 rounded-md bg-red-500/10 p-3 text-xs text-red-400">
                        Condition node must follow a Data Fetch node with a selected database and table.
                    </div>
                )}

                {isDataUpdate && (
                    <div className="mt-3 flex items-center gap-3">
                        <Switch
                            checked={usePreviousFilter}
                            onCheckedChange={(checked) =>
                                updateConfig({
                                    usePreviousFilter: checked,
                                    table: checked ? prevNode?.data.config?.table : "",
                                    filters: checked ? [] : filters,
                                })
                            }
                        />
                        <span className="text-sm text-muted-foreground">
                            Update rows from previous filter
                        </span>
                    </div>
                )}

                {isDataUpdate && usePreviousFilter && selectedTable && (
                    <div className="mt-2 text-xs text-neutral-400">
                        Updating rows from table:{" "}
                        <span className="text-white">
                            {selectedTable}
                        </span>
                    </div>
                )}
                {/* ================= TABLE SELECT ================= */}
                {["DATA_FETCH", "DATA_UPDATE"].includes(node.data.type) &&
                    database &&
                    !(isDataUpdate && usePreviousFilter) &&
                    (
                        <div className="mt-2">
                            <Select
                                value={selectedTable}
                                onValueChange={(v) =>
                                    updateConfig({
                                        table: v,
                                        schema: isInternalSource ? internalSchemaName : "public",
                                        filters: [],
                                        updates: [],
                                    })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select table" />
                                </SelectTrigger>
                                <SelectContent>
                                    {tables.map((t) => (
                                        <SelectItem key={t} value={t}>
                                            {t}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                {isDataTrigger && (
                    <div className="mt-4 space-y-3 rounded-lg border border-white/10 bg-white/5 p-4">
                        <div>
                            <div className="text-sm font-semibold">Internal data trigger</div>
                            <p className="mt-1 text-xs text-neutral-400">
                                Start this workflow when a row changes inside your Runbook data environment.
                            </p>
                        </div>

                        <Select
                            value={node.data.config.table || undefined}
                            onValueChange={(value) => updateConfig({ table: value, schema: internalSchemaName })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select internal table" />
                            </SelectTrigger>
                            <SelectContent>
                                {tables.map((table) => (
                                    <SelectItem key={table} value={table}>
                                        {table}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={node.data.config.eventType || undefined}
                            onValueChange={(value) => updateConfig({ eventType: value, schema: internalSchemaName })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select row event" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ROW_INSERT">Row Insert</SelectItem>
                                <SelectItem value="ROW_UPDATE">Row Update</SelectItem>
                                <SelectItem value="ROW_DELETE">Row Delete</SelectItem>
                            </SelectContent>
                        </Select>

                        {internalSchemaName && (
                            <div className="rounded-md border border-white/10 bg-black/20 px-3 py-3 text-xs text-neutral-400">
                                Listening on schema <span className="font-mono text-cyan-200">{internalSchemaName}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* CONDITION TABLE DISPLAY */}
                {isCondition && selectedTable && (
                    <div className="mt-2 text-xs text-neutral-400">
                        Using table: <span className="text-white">{selectedTable}</span>
                    </div>
                )}

                {/* ================= FILTERS ================= */}
                {["DATA_FETCH", "CONDITION", "DATA_UPDATE"].includes(node.data.type) &&
                    schema &&
                    !(isDataUpdate && usePreviousFilter) && (
                        <>
                            <div className="mt-4 font-semibold text-sm">Filters</div>
                            {filters.map((f: any, i: number) => {
                                const columnSchema = schemaColumns.find(c => c.name === f.column);

                                return (
                                    <div key={i} className="mt-2 flex items-center gap-2">
                                        <ColumnSelect
                                            value={f.column}
                                            onChange={(col: string) => {
                                                const next = [...filters];
                                                next[i] = { column: col, operator: "", value: "" };
                                                updateFilters(next);
                                            }}
                                        />

                                        <Select
                                            value={f.operator}
                                            disabled={!f.column}
                                            onValueChange={(op) => {
                                                const next = [...filters];
                                                next[i].operator = op;
                                                updateFilters(next);
                                            }}
                                        >
                                            <SelectTrigger className="w-[90px]">
                                                <SelectValue placeholder="Op" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {columnSchema?.operators.map(op => (
                                                    <SelectItem key={op} value={op}>{op}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <>
                                            {["string", "text", "number", "date"].includes(columnSchema?.type || "") && (
                                                <Input
                                                    className="w-[120px]"
                                                    placeholder="Value"
                                                    value={f.value}
                                                    type={columnSchema?.type}
                                                    onChange={(e) => {
                                                        const next = [...filters];
                                                        next[i].value = e.target.value;
                                                        updateFilters(next);
                                                    }}
                                                />
                                            )}

                                            {columnSchema?.type === "boolean" && (
                                                <Input
                                                    className="w-[120px]"
                                                    type="checkbox"
                                                    checked={f.value === "true"}
                                                    onChange={(e) => {
                                                        const next = [...filters];
                                                        next[i].value = e.target.checked ? "true" : "false";
                                                        updateFilters(next);
                                                    }}
                                                />
                                            )}
                                        </>


                                        <Button variant="ghost" onClick={() =>
                                            updateFilters(filters.filter((_, x) => x !== i))
                                        }>✕</Button>
                                    </div>
                                );
                            })}

                            <Button className="mt-3 w-full" onClick={() =>
                                updateFilters([...filters, { column: "", operator: "", value: "" }])
                            }>+ Add Filter</Button>
                        </>
                    )}

                {/* ================= DATA UPDATE ================= */}
                {node.data.type === "DATA_UPDATE" && schema && (
                    <>
                        <div className="mt-6 font-semibold text-sm">Update Fields</div>
                        {updates.map((u: any, i: number) => (
                            <div key={i} className="mt-2 flex items-center gap-2">
                                <ColumnSelect
                                    value={u.column}
                                    onChange={(col: string) => {
                                        const next = [...updates];
                                        next[i].column = col;
                                        updateUpdates(next);
                                    }}
                                />
                                <Input
                                    placeholder="New Value"
                                    value={u.value}
                                    onChange={(e) => {
                                        const next = [...updates];
                                        next[i].value = e.target.value;
                                        updateUpdates(next);
                                    }}
                                />
                                <Button variant="ghost" onClick={() =>
                                    updateUpdates(updates.filter((_, x) => x !== i))
                                }>✕</Button>
                            </div>
                        ))}

                        <Button className="mt-3 w-full" onClick={() =>
                            updateUpdates([...updates, { column: "", value: "" }])
                        }>+ Add Update</Button>
                    </>
                )}

                {isLoop && (
                    <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-4">
                        <div className="text-sm font-semibold">Loop Source</div>
                        <p className="mt-1 text-xs text-neutral-400">
                            Choose the node whose packets should be iterated downstream.
                        </p>
                        <div className="mt-3">
                            <Select
                                value={node.data.config.sourceNode || undefined}
                                onValueChange={(value) => updateConfig({ sourceNode: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select source node" />
                                </SelectTrigger>
                                <SelectContent>
                                    {candidateSourceNodes.map((candidate) => (
                                        <SelectItem key={candidate.id} value={candidate.id}>
                                            {candidate.data.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}

                {/* ================= TOOL TRIGGER ================= */}
                {node.data.type === "TOOL_TRIGGER" && (
                    <>

                        {/* Toggle */}
                        <div className="flex items-center gap-3 mt-3">
                            <Switch
                                checked={node.data.config.includePrevious || false}
                                onCheckedChange={(checked) => updateConfig({ includePrevious: checked })}
                            />
                            <span className="text-sm text-muted-foreground">
                                Include result from previous node
                            </span>
                        </div>
                        <div className="mt-4">
                            <Input
                                placeholder="Tool Name (http_tool, kafka_tool, slack_tool, ai_tool, email_tool)"
                                value={node.data.config.toolName || ""}
                                onChange={(e) => updateConfig({ toolName: e.target.value })}
                            />
                        </div>
                        <div className="mt-3">
                            <textarea
                                className="w-full h-32 p-2 rounded bg-black text-white border border-white/10"
                                placeholder='JSON Payload { "key": "value" }'
                                value={node.data.config.payload || ""}
                                onChange={(e) => updateConfig({ payload: e.target.value })}
                            />
                        </div>
                    </>
                )}

                {/* ================= DATA TRIGGER ================= */}
                {/* A code block with Javascript function call like trigger(node.id, data: {}) with a copy button */}
                {isWebhookTrigger && (
                    <>

                        <div className="mt-4 text-sm">
                            Trigger this workflow from an external system by posting JSON to:
                        </div>

                        <div className="relative mt-3 bg-black text-green-400 rounded-lg p-4 text-sm font-mono overflow-x-auto">
                            <pre>
                                {`POST ${process.env.NEXT_PUBLIC_SPRING_API_ENDPOINT}/workflow/trigger/${workFlowId}
{
  "payload": {
    "email": "user@example.com",
    "source": "${node.id}"
  }
}`}
                            </pre>

                            <button
                                onClick={async () => {
                                    const code = `POST ${process.env.NEXT_PUBLIC_SPRING_API_ENDPOINT}/workflow/trigger/${workFlowId}
{
  "payload": {
    "email": "user@example.com",
    "source": "${node.id}"
  }
}`;
                                    await navigator.clipboard.writeText(code);
                                    toast.success("Webhook example copied to clipboard!");
                                }}
                                className="absolute top-2 right-2 bg-white text-black text-xs px-2 py-1 rounded hover:bg-gray-200 transition"
                            >
                                Copy
                            </button>
                        </div>
                    </>
                )}

                <Button
                    variant="destructive"
                    className="mt-6     w-fit"
                    onClick={() => handleDeleteNode(node.id)}
                >
                    Delete Node
                </Button>
            </DialogContent>
        </Dialog>
    );
}
