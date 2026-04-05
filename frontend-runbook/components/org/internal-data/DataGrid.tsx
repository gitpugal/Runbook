"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type ColumnDefinition = {
    id: string;
    columnName: string;
    displayName: string;
    type: string;
    required: boolean;
    unique: boolean;
};

type DataGridProps = {
    tableName: string;
    columns: ColumnDefinition[];
    rows: Record<string, unknown>[];
    loading: boolean;
    onCreateRow: (values: Record<string, unknown>) => Promise<void>;
    onUpdateRow: (rowId: string, values: Record<string, unknown>) => Promise<void>;
    onDeleteRow: (rowId: string) => Promise<void>;
};

const hiddenColumns = new Set(["id", "created_at", "updated_at"]);

function normalizeValue(value: unknown) {
    if (value === null || value === undefined) {
        return "";
    }

    if (typeof value === "object") {
        return JSON.stringify(value);
    }

    return String(value);
}

export function DataGrid({
    tableName,
    columns,
    rows,
    loading,
    onCreateRow,
    onUpdateRow,
    onDeleteRow,
}: DataGridProps) {
    const [query, setQuery] = useState("");
    const [sortColumn, setSortColumn] = useState<string>("created_at");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
    const [editorOpen, setEditorOpen] = useState(false);
    const [editingRow, setEditingRow] = useState<Record<string, unknown> | null>(null);
    const [draft, setDraft] = useState<Record<string, string>>({});
    const editableColumns = useMemo(() => columns.filter((column) => !hiddenColumns.has(column.columnName)), [columns]);

    const filteredRows = useMemo(() => {
        const loweredQuery = query.trim().toLowerCase();
        const nextRows = [...rows];

        nextRows.sort((left, right) => {
            const leftValue = normalizeValue(left[sortColumn]);
            const rightValue = normalizeValue(right[sortColumn]);
            return sortDirection === "asc"
                ? leftValue.localeCompare(rightValue, undefined, { numeric: true })
                : rightValue.localeCompare(leftValue, undefined, { numeric: true });
        });

        if (!loweredQuery) {
            return nextRows;
        }

        return nextRows.filter((row) =>
            Object.values(row).some((value) => normalizeValue(value).toLowerCase().includes(loweredQuery))
        );
    }, [query, rows, sortColumn, sortDirection]);

    function openCreateDialog() {
        setDraft({});
        setEditingRow(null);
        setEditorOpen(true);
    }

    function openEditDialog(row: Record<string, unknown>) {
        const nextDraft = Object.fromEntries(
            editableColumns.map((column) => [column.columnName, normalizeValue(row[column.columnName])])
        );
        setDraft(nextDraft);
        setEditingRow(row);
        setEditorOpen(true);
    }

    async function handleSubmit() {
        const values = Object.fromEntries(
            editableColumns
                .map((column) => [column.columnName, draft[column.columnName] ?? ""])
                .filter(([, value]) => value !== "")
        );

        if (editingRow?.id) {
            await onUpdateRow(String(editingRow.id), values);
        } else {
            await onCreateRow(values);
        }

        setEditorOpen(false);
    }

    function handleEditorOpenChange(open: boolean) {
        setEditorOpen(open);
        if (!open) {
            setDraft({});
            setEditingRow(null);
        }
    }

    return (
        <div className="rounded-2xl border border-white/10 bg-[#07111d]/95">
            <div className="flex flex-col gap-4 border-b border-white/10 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <p className="text-sm font-semibold text-white">{tableName} data</p>
                    <p className="mt-1 text-sm text-slate-400">
                        Capture rows directly inside Runbook and use them in workflows.
                    </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative min-w-64">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500" />
                        <Input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Filter rows"
                            className="border-white/10 bg-black/20 pl-9 text-white"
                        />
                    </div>

                    <Button onClick={openCreateDialog}>
                        <Plus />
                        Add row
                    </Button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="border-b border-white/10 bg-black/20 text-left text-xs uppercase tracking-[0.16em] text-slate-400">
                        <tr>
                            {["id", ...editableColumns.map((column) => column.columnName), "created_at"].map((columnName) => (
                                <th key={columnName} className="px-4 py-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (sortColumn === columnName) {
                                                setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
                                            } else {
                                                setSortColumn(columnName);
                                                setSortDirection("asc");
                                            }
                                        }}
                                        className="inline-flex items-center gap-2"
                                    >
                                        {columnName}
                                        {sortColumn === columnName ? (
                                            <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                                        ) : null}
                                    </button>
                                </th>
                            ))}
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {loading && (
                            <tr>
                                <td colSpan={editableColumns.length + 3} className="px-4 py-10 text-center text-slate-400">
                                    Loading rows...
                                </td>
                            </tr>
                        )}

                        {!loading && filteredRows.length === 0 && (
                            <tr>
                                <td colSpan={editableColumns.length + 3} className="px-4 py-10 text-center text-slate-400">
                                    No rows yet.
                                </td>
                            </tr>
                        )}

                        {!loading && filteredRows.map((row) => (
                            <tr key={String(row.id)} className="border-b border-white/5 text-slate-200 last:border-0">
                                <td className="px-4 py-3 font-mono text-xs text-cyan-200">{normalizeValue(row.id)}</td>
                                {editableColumns.map((column) => (
                                    <td key={column.id} className="px-4 py-3">{normalizeValue(row[column.columnName])}</td>
                                ))}
                                <td className="px-4 py-3 text-slate-400">{normalizeValue(row.created_at)}</td>
                                <td className="px-4 py-3">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="outline" size="sm" onClick={() => openEditDialog(row)}>
                                            <Pencil />
                                            Edit
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => onDeleteRow(String(row.id))}
                                        >
                                            <Trash2 />
                                            Delete
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Dialog open={editorOpen} onOpenChange={handleEditorOpenChange}>
                <DialogContent className="border-white/10 bg-[#05101a] text-white sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>{editingRow ? "Edit row" : "Add row"}</DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-4 py-2">
                        {editableColumns.map((column) => (
                            <label key={column.id} className="grid gap-2">
                                <span className="text-sm font-medium text-slate-200">{column.displayName}</span>
                                <Input
                                    value={draft[column.columnName] ?? ""}
                                    onChange={(event) =>
                                        setDraft((current) => ({
                                            ...current,
                                            [column.columnName]: event.target.value,
                                        }))
                                    }
                                    placeholder={column.columnName}
                                    className="border-white/10 bg-black/20 text-white"
                                />
                            </label>
                        ))}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditorOpen(false)}>Cancel</Button>
                        <Button onClick={handleSubmit}>{editingRow ? "Save changes" : "Create row"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
