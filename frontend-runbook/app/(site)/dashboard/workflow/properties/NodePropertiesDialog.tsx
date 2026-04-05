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

import { Node, Edge } from "reactflow";
import { TABLE_SCHEMAS } from "../schema/tableSchemas";

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

    /* ---------------- previous node (for CONDITION) ---------------- */
    const incomingEdge = edges.find((e) => e.target === node.id);
    const prevNode = allNodes.find((n) => n.id === incomingEdge?.source);

    const table =
        node.data.type === "CONDITION"
            ? prevNode?.data.config?.table
            : node.data.config?.table;

    const schema = table ? TABLE_SCHEMAS[table] : null;

    const filters: any[] = node.data.config.filters || [];

    /* ---------------- helpers ---------------- */

    const updateFilters = (next: any[]) => {
        onChange({
            ...node.data.config,
            filters: next,
        });
    };

    /* ---------------- render ---------------- */

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="w-1/2 min-h-50 max-h-105 overflow-y-scroll bg-[#050b17] text-white">
                <DialogHeader>
                    <DialogTitle>{node.data.label}</DialogTitle>
                </DialogHeader>

                {/* ================= TABLE SELECT ================= */}
                {(node.data.type === "DATA_FETCH") && (
                    <div className="mt-2">
                        <Select
                            value={node.data.config.table}
                            onValueChange={(v) =>
                                onChange({
                                    ...node.data.config,
                                    table: v,
                                    filters: [],
                                })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select table" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.keys(TABLE_SCHEMAS).map((t) => (
                                    <SelectItem key={t} value={t}>
                                        {t}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* ================= FILTERS ================= */}
                {(node.data.type === "DATA_FETCH" ||
                    node.data.type === "CONDITION") && (
                        <>
                            {filters.map((f: any, i: number) => {
                                const columnSchema = schema?.columns.find(
                                    (c) => c.name === f.column
                                );

                                return (
                                    <div
                                        key={i}
                                        className="mt-3 flex items-center gap-2"
                                    >
                                        {/* COLUMN */}
                                        <Select
                                            value={f.column}
                                            onValueChange={(v) => {
                                                const next = [...filters];
                                                next[i] = {
                                                    column: v,
                                                    operator: "",
                                                    value: "",
                                                };
                                                updateFilters(next);
                                            }}
                                        >
                                            <SelectTrigger className="w-[130px]">
                                                <SelectValue placeholder="Column" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {schema?.columns.map((c) => (
                                                    <SelectItem key={c.name} value={c.name}>
                                                        {c.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        {/* OPERATOR */}
                                        <Select
                                            value={f.operator}
                                            disabled={!f.column}
                                            onValueChange={(v) => {
                                                const next = [...filters];
                                                next[i].operator = v;
                                                updateFilters(next);
                                            }}
                                        >
                                            <SelectTrigger className="w-[90px]">
                                                <SelectValue placeholder="Op" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {columnSchema?.operators.map((op) => (
                                                    <SelectItem key={op} value={op}>
                                                        {op}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        {/* VALUE */}
                                        <Input
                                            className="w-[120px]"
                                            placeholder="Value"
                                            value={f.value}
                                            disabled={!f.operator}
                                            onChange={(e) => {
                                                const next = [...filters];
                                                next[i].value = e.target.value;
                                                updateFilters(next);
                                            }}
                                        />

                                        {/* DELETE */}
                                        <Button
                                            variant="ghost"
                                            onClick={() =>
                                                updateFilters(
                                                    filters.filter((_, x) => x !== i)
                                                )
                                            }
                                        >
                                            ✕
                                        </Button>
                                    </div>
                                );
                            })}

                            {/* ADD FILTER */}
                            <Button
                                className="mt-4 w-full"
                                onClick={() =>
                                    updateFilters([
                                        ...filters,
                                        { column: "", operator: "", value: "" },
                                    ])
                                }
                            >
                                + Add Filter
                            </Button>
                        </>
                    )}
            </DialogContent>
        </Dialog>
    );
}
