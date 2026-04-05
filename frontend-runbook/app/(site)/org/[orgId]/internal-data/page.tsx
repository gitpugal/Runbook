"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowRightLeft, Database, DatabaseZap, FolderKanban, Plus, Rows3, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DomainCard } from "@/components/org/internal-data/DomainCard";
import { DataGrid } from "@/components/org/internal-data/DataGrid";

type InternalColumn = {
    id: string;
    columnName: string;
    displayName: string;
    type: "TEXT" | "NUMBER" | "BOOLEAN" | "DATE" | "DATETIME" | "EMAIL" | "UUID" | "REFERENCE";
    required: boolean;
    unique: boolean;
    defaultValue?: string | null;
};

type InternalEntity = {
    id: string;
    domainId: string | null;
    tableName: string;
    displayName: string;
    columns: InternalColumn[];
};

type InternalDomain = {
    id: string;
    name: string;
    description?: string | null;
};

type InternalEnvironment = {
    id: string;
    schemaName: string;
    organizationId: string;
    createdAt: string;
};

type InternalRelationship = {
    id: string;
    sourceEntityId: string;
    targetEntityId: string;
    sourceEntityName: string;
    targetEntityName: string;
    type: "ONE_TO_ONE" | "ONE_TO_MANY" | "MANY_TO_ONE";
    sourceColumn: string;
    targetColumn: string;
};

type Workspace = {
    environments: InternalEnvironment[] | null;
    entities: InternalEntity[];
    relationships: InternalRelationship[];
};

type DataSourceMode = "INTERNAL" | "UPSTREAM";

type UpstreamDatabase = {
    id: string
    name: string
    type: string
    host: string
    port: number
    createdAt: string
}

const emptyWorkspace: Workspace = {
    environments: [],
    entities: [],
    relationships: [],
};

const columnTypeOptions = ["TEXT", "NUMBER", "BOOLEAN", "DATE", "DATETIME", "EMAIL", "UUID", "REFERENCE"] as const;
const sections = [
    // { id: "domains", label: "Domains", icon: FolderKanban },
    { id: "tables", label: "Tables", icon: Database },
    { id: "data", label: "Data", icon: Rows3 },
] as const;

export default function InternalDataPage() {
    const { orgId } = useParams<{ orgId: string }>();
    const [workspace, setWorkspace] = useState<Workspace>(emptyWorkspace);
    const [selectedSection, setSelectedSection] = useState<(typeof sections)[number]["id"]>("tables");
    const [selectedEntityId, setSelectedEntityId] = useState<string>("");
    const [rows, setRows] = useState<Record<string, unknown>[]>([]);
    const [workspaceLoading, setWorkspaceLoading] = useState(true);
    const [rowsLoading, setRowsLoading] = useState(false);
    const [environmentBusy, setEnvironmentBusy] = useState(false);
    const [domainDialogOpen, setDomainDialogOpen] = useState(false);
    const [tableDialogOpen, setTableDialogOpen] = useState(false);
    const [columnDialogOpen, setColumnDialogOpen] = useState(false);
    const [relationshipDialogOpen, setRelationshipDialogOpen] = useState(false);

    const [dataSourceMode, setDataSourceMode] = useState<DataSourceMode>("INTERNAL")
    const [upstreamDbs, setUpstreamDbs] = useState<UpstreamDatabase[]>([])
    const [upstreamLoading, setUpstreamLoading] = useState(false);
    const [currentEnvironment, setCurrentEnvironment] = useState<InternalEnvironment | null>(null);

    const [domainForm, setDomainForm] = useState({ name: "", description: "" });
    const [tableForm, setTableForm] = useState({
        domainId: "",
        tableName: "",
        displayName: "",
        columns: [
            {
                columnName: "",
                displayName: "",
                type: "TEXT" as InternalColumn["type"],
                required: false,
                unique: false,
            },
        ],
    });
    const [columnForm, setColumnForm] = useState({
        columnName: "",
        displayName: "",
        type: "TEXT" as InternalColumn["type"],
        required: false,
        unique: false,
        defaultValue: "",
    });
    const [relationshipForm, setRelationshipForm] = useState({
        sourceEntityId: "",
        targetEntityId: "",
        type: "ONE_TO_MANY" as InternalRelationship["type"],
        sourceColumn: "",
        targetColumn: "id",
    });

    const selectedEntity = useMemo(
        () =>
            workspace?.entities?.find((entity) => entity.id === selectedEntityId) ?? null,
        [selectedEntityId, workspace?.entities]
    );

    // const tablesByDomain = useMemo(() => {
    //     return workspace?.entities?.reduce<Record<string, number>>((accumulator, entity) => {
    //         const key = entity.domainId ?? "__unassigned__";
    //         accumulator[key] = (accumulator[key] ?? 0) + 1;
    //         return accumulator;
    //     }, {});
    // }, [workspace?.entities]);

    useEffect(() => {
        if (!currentEnvironment) {
            // toast.error("Current environment is missing");
            return;
        }

        async function loadEnvironment() {
            try {
                setWorkspaceLoading(true);
                const response = await fetch(`${process.env.NEXT_PUBLIC_SPRING_API_ENDPOINT}/orgs/${orgId}/internal-data/environment?orgId=${orgId}&envId=${currentEnvironment?.id}`);
                if (!response.ok) {
                    throw new Error("Failed to load internal data workspace");
                }

                const payload: Workspace = await response.json();

                setWorkspace((ext) => ({ ...ext, ...payload }));
                if (payload.environments && payload.environments.length > 0) {
                    setCurrentEnvironment(payload.environments[0]);
                }
                setSelectedEntityId((current) => current || payload.entities[0]?.id || "");
            } catch (error) {
                console.error(error);
                toast.error("Could not load Internal Data");
            } finally {
                setWorkspaceLoading(false);
            }
        }
        loadEnvironment();
    }, [currentEnvironment]);


    useEffect(() => {

        if (!orgId) return

        async function loadUpstream() {

            try {

                setUpstreamLoading(true)

                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_SPRING_API_ENDPOINT}/orgs/${orgId}/databases`
                )

                const data = await res.json();
                console.log("Fetched upstream databases:", data);

                setUpstreamDbs(data)

            } catch (e) {

                toast.error("Failed to load connected databases")

            } finally {

                setUpstreamLoading(false)

            }

        }

        loadUpstream()

    }, [orgId])

    useEffect(() => {
        if (!orgId) {
            return;
        }

        async function loadWorkspace() {
            try {
                setWorkspaceLoading(true);
                const response = await fetch(`${process.env.NEXT_PUBLIC_SPRING_API_ENDPOINT}/orgs/${orgId}/internal-data/workspace`);
                if (!response.ok) {
                    throw new Error("Failed to load internal data workspace");
                }

                const payload: Workspace = await response.json();
                setWorkspace((ext) => ({ ...ext, ...payload }));
                if (payload.environments && payload.environments.length > 0) {
                    setCurrentEnvironment(payload.environments[0]);
                }
                setSelectedEntityId((current) => current || payload.entities != null ? payload.entities[0]?.id || "" : "");
            } catch (error) {
                console.error(error);
                toast.error("Could not load Internal Data");
            } finally {
                setWorkspaceLoading(false);
            }
        }

        loadWorkspace();
    }, [orgId]);

    useEffect(() => {
        if (!orgId || !selectedEntityId) {
            setRows([]);
            return;
        }

        async function loadRows() {
            try {
                setRowsLoading(true);
                const response = await fetch(`${process.env.NEXT_PUBLIC_SPRING_API_ENDPOINT}/orgs/${orgId}/internal-data/entities/${selectedEntityId}/rows`);
                if (!response.ok) {
                    throw new Error("Failed to load rows");
                }

                const payload = await response.json();
                setRows(payload.rows ?? []);
            } catch (error) {
                console.error(error);
                toast.error("Could not load table rows");
            } finally {
                setRowsLoading(false);
            }
        }

        loadRows();
    }, [orgId, selectedEntityId]);

    async function refreshWorkspace() {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SPRING_API_ENDPOINT}/orgs/${orgId}/internal-data/workspace`);
        const payload: Workspace = await response.json();
        setWorkspace((ext) => ({ ...payload }));
        console.log("Refreshed workspace:", payload);
        setSelectedEntityId(
            (current) => current ?? payload.entities?.[0]?.id ?? ""
        );
    }

    async function handleCreateEnvironment() {
        try {
            setEnvironmentBusy(true);
            const response = await fetch(`${process.env.NEXT_PUBLIC_SPRING_API_ENDPOINT}/orgs/${orgId}/internal-data/environment`, {
                method: "POST",
            });
            if (!response.ok) {
                throw new Error("Failed to create environment");
            }

            await refreshWorkspace();
            toast.success("Internal data environment created");
        } catch (error) {
            console.error(error);
            toast.error("Environment setup failed");
        } finally {
            setEnvironmentBusy(false);
        }
    }

    async function handleCreateDomain() {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_SPRING_API_ENDPOINT}/orgs/${orgId}/internal-data/domains`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(domainForm),
            });
            if (!response.ok) {
                throw new Error("Failed to create schema");
            }

            setDomainDialogOpen(false);
            setDomainForm({ name: "", description: "" });
            await refreshWorkspace();
            toast.success("Schema created");
        } catch (error) {
            console.error(error);
            toast.error("Schema could not be created");
        }
    }

    async function handleCreateTable() {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_SPRING_API_ENDPOINT}/orgs/${orgId}/internal-data/entities`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    domainId: currentEnvironment?.id || null,
                    tableName: tableForm.tableName,
                    displayName: tableForm.displayName,
                    columns: tableForm.columns,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to create table");
            }

            const entity: InternalEntity = await response.json();
            setTableDialogOpen(false);
            setTableForm({
                domainId: "",
                tableName: "",
                displayName: "",
                columns: [{ columnName: "", displayName: "", type: "TEXT", required: false, unique: false }],
            });
            await refreshWorkspace();
            setSelectedEntityId(entity.id);
            setSelectedSection("tables");
            toast.success("Table created");
        } catch (error) {
            console.error(error);
            toast.error("Table creation failed");
        }
    }

    async function handleAddColumn() {
        if (!selectedEntityId) {
            return;
        }

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_SPRING_API_ENDPOINT}/orgs/${orgId}/internal-data/entities/${selectedEntityId}/columns`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(columnForm),
            });

            if (!response.ok) {
                throw new Error("Failed to add column");
            }

            setColumnDialogOpen(false);
            setColumnForm({ columnName: "", displayName: "", type: "TEXT", required: false, unique: false, defaultValue: "" });
            await refreshWorkspace();
            toast.success("Column added");
        } catch (error) {
            console.error(error);
            toast.error("Column could not be added");
        }
    }

    async function handleCreateRelationship() {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_SPRING_API_ENDPOINT}/orgs/${orgId}/internal-data/relationships`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(relationshipForm),
            });

            if (!response.ok) {
                throw new Error("Failed to create relationship");
            }

            setRelationshipDialogOpen(false);
            setRelationshipForm({
                sourceEntityId: "",
                targetEntityId: "",
                type: "ONE_TO_MANY",
                sourceColumn: "",
                targetColumn: "id",
            });
            await refreshWorkspace();
            toast.success("Relationship created");
        } catch (error) {
            console.error(error);
            toast.error("Relationship could not be created");
        }
    }

    async function createRow(values: Record<string, unknown>) {
        await fetch(`${process.env.NEXT_PUBLIC_SPRING_API_ENDPOINT}/orgs/${orgId}/internal-data/entities/${selectedEntityId}/rows`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ values }),
        });
        const response = await fetch(`${process.env.NEXT_PUBLIC_SPRING_API_ENDPOINT}/orgs/${orgId}/internal-data/entities/${selectedEntityId}/rows`);
        const payload = await response.json();
        setRows(payload.rows ?? []);
        toast.success("Row created");
    }

    async function updateRow(rowId: string, values: Record<string, unknown>) {
        await fetch(`${process.env.NEXT_PUBLIC_SPRING_API_ENDPOINT}/orgs/${orgId}/internal-data/entities/${selectedEntityId}/rows/${rowId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ values }),
        });
        const response = await fetch(`${process.env.NEXT_PUBLIC_SPRING_API_ENDPOINT}/orgs/${orgId}/internal-data/entities/${selectedEntityId}/rows`);
        const payload = await response.json();
        setRows(payload.rows ?? []);
        toast.success("Row updated");
    }

    async function deleteRow(rowId: string) {
        await fetch(`${process.env.NEXT_PUBLIC_SPRING_API_ENDPOINT}/orgs/${orgId}/internal-data/entities/${selectedEntityId}/rows/${rowId}`, {
            method: "DELETE",
        });
        setRows((current) => current.filter((row) => String(row.id) !== rowId));
        toast.success("Row deleted");
    }

    if (workspaceLoading) {
        return (
            <div className="app-page">
                <div className="app-page-inner">
                    <div className="h-56 animate-pulse rounded-3xl border border-white/10 bg-white/[0.04]" />
                </div>
            </div>
        );
    }

    return (
        <div className="app-page">

            <div className="flex gap-2 rounded-xl border border-white/10 bg-[#07111d] p-1 w-fit mb-5">

                <button
                    onClick={() => setDataSourceMode("INTERNAL")}
                    className={`px-4 py-2 rounded-lg text-sm ${dataSourceMode === "INTERNAL"
                        ? "bg-cyan-500/20 text-white"
                        : "text-slate-400 hover:text-white"
                        }`}
                >
                    Internal Data
                </button>

                <button
                    onClick={() => setDataSourceMode("UPSTREAM")}
                    className={`px-4 py-2 rounded-lg text-sm ${dataSourceMode === "UPSTREAM"
                        ? "bg-cyan-500/20 text-white"
                        : "text-slate-400 hover:text-white"
                        }`}
                >
                    Connected Databases
                </button>

            </div>
            <div className="app-page-inner">
                <div className="flex w-full flex-row items-center justify-start gap-2">

                    <Select
                        value={currentEnvironment?.id}
                        onValueChange={(value) =>
                            setCurrentEnvironment(
                                workspace?.environments?.find((e) => e.id === value) ?? null
                            )
                        }
                        disabled={!workspace?.environments || workspace?.environments.length === 0}
                    >
                        <SelectTrigger className=" bg-[#0b1625] border-white/10 text-white">
                            <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0b1625] border-white/10">
                            {workspace?.environments?.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                    {c.schemaName.split("_")[c.schemaName.split("_").length - 1]}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button className="w-fit " variant="outline" onClick={() => setDomainDialogOpen(true)} disabled={environmentBusy}>
                        <FolderKanban />
                        Add schema
                    </Button>
                </div>
                {!workspace?.environments || workspace?.environments.length === 0 && (
                    <section className="rounded-3xl border border-dashed border-cyan-400/20 bg-[linear-gradient(145deg,rgba(12,20,32,0.96),rgba(4,9,16,0.88))] px-8 py-10">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                            <div className="max-w-2xl">
                                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200">Setup</p>
                                <h2 className="mt-3 text-2xl font-semibold text-white">Create an isolated Runbook data schema for this organization</h2>
                                <p className="mt-3 text-sm leading-7 text-slate-300">
                                    Runbook will provision a dedicated Postgres schema and use it for tables, relationships, rows, and workflow triggers.
                                </p>
                            </div>

                            <Button onClick={() => setDomainDialogOpen(true)} disabled={environmentBusy}>
                                <Sparkles />
                                {environmentBusy ? "Creating..." : "Create a Schema"}
                            </Button>
                        </div>
                    </section>
                )

                }
                <div className="rounded-[28px] border border-cyan-500/15 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_36%),linear-gradient(145deg,rgba(6,11,20,0.98),rgba(4,8,15,0.92))] p-7">
                    <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
                        <div className="max-w-3xl">
                            <p className="app-kicker text-cyan-200">Internal Data</p>
                            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">Customer data environment</h1>

                        </div>



                        <Button onClick={() => setTableDialogOpen(true)} disabled={!currentEnvironment}>
                            <DatabaseZap />
                            Create table
                        </Button>
                    </div>

                    <div className="mt-8 grid gap-4 lg:grid-cols-3">
                        <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4">
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Schema</p>
                            <p className="mt-2 font-mono text-sm text-cyan-200">{currentEnvironment?.schemaName.split("_")[currentEnvironment?.schemaName.split("_").length - 1] ?? "Not provisioned yet"}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4">
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Tables</p>
                            <p className="mt-2 text-2xl font-semibold text-white">{workspace?.entities?.length}</p>
                        </div>
                    </div>
                </div>



                {workspace?.environments && (
                    <>
                        <div className="flex flex-wrap gap-3">
                            {sections.map((section) => (
                                <button
                                    key={section.id}
                                    type="button"
                                    onClick={() => setSelectedSection(section.id)}
                                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${selectedSection === section.id
                                        ? "border-cyan-400/30 bg-cyan-400/15 text-white"
                                        : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:text-white"
                                        }`}
                                >
                                    <section.icon size={16} />
                                    {section.label}
                                </button>
                            ))}
                        </div>

                        {/* {selectedSection === "domains" && (
                            <section className="grid gap-4 xl:grid-cols-2">
                                {workspace?.domains.length === 0 ? (
                                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-8 text-sm text-slate-400">
                                        No domains yet. Create your first domain to organize tables by business function.
                                    </div>
                                ) : (
                                    workspace?.domains.map((domain) => (
                                        <DomainCard
                                            key={domain.id}
                                            name={domain.name}
                                            description={domain.description}
                                            tableCount={tablesByDomain[domain.id] ?? 0}
                                        />
                                    ))
                                )}
                            </section>
                        )} */}

                        {selectedSection === "tables" && (
                            <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                                <div className="rounded-2xl border border-white/10 bg-[#07111d]/95">
                                    <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                                        <div>
                                            <p className="text-sm font-semibold text-white">Tables</p>
                                            <p className="mt-1 text-sm text-slate-400">Schema builder</p>
                                        </div>
                                        <Button onClick={() => setTableDialogOpen(true)} disabled={!currentEnvironment}>
                                            <Plus />
                                            Create table
                                        </Button>
                                    </div>

                                    <div className="divide-y divide-white/5">
                                        {workspace?.entities?.map((entity) => (
                                            <button
                                                key={entity.id}
                                                type="button"
                                                onClick={() => setSelectedEntityId(entity.id)}
                                                className={`flex w-full items-center justify-between px-5 py-4 text-left transition ${selectedEntityId === entity.id ? "bg-cyan-400/10" : "hover:bg-white/[0.03]"
                                                    }`}
                                            >
                                                <div>
                                                    <p className="text-sm font-semibold text-white">{entity.displayName}</p>
                                                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">{entity.tableName}</p>
                                                </div>
                                                <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                                                    {entity.columns.length} columns
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    <div className="rounded-2xl border border-white/10 bg-[#07111d]/95">
                                        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                                            <div>
                                                <p className="text-sm font-semibold text-white">{selectedEntity?.displayName ?? "Select a table"}</p>
                                                <p className="mt-1 text-sm text-slate-400">
                                                    {selectedEntity ? `${selectedEntity.tableName} inside ${currentEnvironment?.schemaName}` : "Choose a table to inspect columns."}
                                                </p>
                                            </div>
                                            <Button variant="outline" onClick={() => setColumnDialogOpen(true)} disabled={!selectedEntity}>
                                                <Plus />
                                                Add column
                                            </Button>
                                        </div>

                                        <div className="divide-y divide-white/5">
                                            {selectedEntity?.columns.map((column) => (
                                                <div key={column.id} className="grid grid-cols-[1.2fr_0.8fr_0.6fr_0.6fr] gap-4 px-5 py-4 text-sm">
                                                    <div>
                                                        <p className="font-medium text-white">{column.displayName}</p>
                                                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">{column.columnName}</p>
                                                    </div>
                                                    <div className="text-slate-300">{column.type}</div>
                                                    <div className="text-slate-300">{column.required ? "Required" : "Optional"}</div>
                                                    <div className="text-slate-300">{column.unique ? "Unique" : "Standard"}</div>
                                                </div>
                                            ))}
                                            {!selectedEntity && (
                                                <div className="px-5 py-8 text-sm text-slate-400">
                                                    Pick a table from the left to review or extend its schema.
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-white/10 bg-[#07111d]/95">
                                        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                                            <div>
                                                <p className="text-sm font-semibold text-white">Relationships</p>
                                                <p className="mt-1 text-sm text-slate-400">Link tables so workflows can navigate customer data safely.</p>
                                            </div>
                                            <Button variant="outline" onClick={() => setRelationshipDialogOpen(true)} disabled={workspace?.entities?.length < 2}>
                                                <ArrowRightLeft />
                                                Add relationship
                                            </Button>
                                        </div>

                                        <div className="divide-y divide-white/5">
                                            {workspace?.relationships?.map((relationship) => (
                                                <div key={relationship.id} className="px-5 py-4">
                                                    <p className="text-sm font-medium text-white">
                                                        {relationship.sourceEntityName} {"->"} {relationship.targetEntityName}
                                                    </p>
                                                    <p className="mt-2 text-sm text-slate-300">
                                                        {relationship.type} using {relationship.sourceColumn} {"->"} {relationship.targetColumn}
                                                    </p>
                                                </div>
                                            ))}
                                            {workspace?.relationships?.length === 0 && (
                                                <div className="px-5 py-8 text-sm text-slate-400">
                                                    No relationships yet. Create one to connect records across tables.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                        {selectedSection === "data" && (
                            <section className="space-y-5">
                                <div className="flex flex-wrap gap-3">
                                    {workspace?.entities?.map((entity) => (
                                        <button
                                            key={entity.id}
                                            type="button"
                                            onClick={() => setSelectedEntityId(entity.id)}
                                            className={`rounded-full border px-4 py-2 text-sm transition ${selectedEntityId === entity.id
                                                ? "border-cyan-400/30 bg-cyan-400/15 text-white"
                                                : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:text-white"
                                                }`}
                                        >
                                            {entity.displayName}
                                        </button>
                                    ))}
                                </div>

                                {selectedEntity ? (
                                    <DataGrid
                                        tableName={selectedEntity.displayName}
                                        columns={selectedEntity.columns}
                                        rows={rows}
                                        loading={rowsLoading}
                                        onCreateRow={createRow}
                                        onUpdateRow={updateRow}
                                        onDeleteRow={deleteRow}
                                    />
                                ) : (
                                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-10 text-sm text-slate-400">
                                        Create a table first to start capturing rows.
                                    </div>
                                )}
                            </section>
                        )}
                    </>
                )}

                <Dialog open={domainDialogOpen} onOpenChange={setDomainDialogOpen}>
                    <DialogContent className="border-white/10 bg-[#05101a] text-white">
                        <DialogHeader>
                            <DialogTitle>Create schema</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-2">
                            <div className="grid gap-2">
                                <Label>Name</Label>
                                <Input value={domainForm.name} onChange={(event) => setDomainForm((current) => ({ ...current, name: event.target.value }))} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Description</Label>
                                <Input value={domainForm.description} onChange={(event) => setDomainForm((current) => ({ ...current, description: event.target.value }))} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDomainDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreateDomain}>Create schema</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={tableDialogOpen} onOpenChange={setTableDialogOpen}>
                    <DialogContent className="border-white/10 bg-[#05101a] text-white sm:max-w-3xl">
                        <DialogHeader>
                            <DialogTitle>Create table</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-2">
                            <div className="grid gap-2 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label>Display name</Label>
                                    <Input value={tableForm.displayName} onChange={(event) => setTableForm((current) => ({ ...current, displayName: event.target.value }))} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Table name</Label>
                                    <Input value={tableForm.tableName} onChange={(event) => setTableForm((current) => ({ ...current, tableName: event.target.value }))} placeholder="customers" />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label>Columns</Label>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            setTableForm((current) => ({
                                                ...current,
                                                columns: [
                                                    ...current.columns,
                                                    { columnName: "", displayName: "", type: "TEXT", required: false, unique: false },
                                                ],
                                            }))
                                        }
                                    >
                                        <Plus />
                                        Add column
                                    </Button>
                                </div>
                                {tableForm.columns.map((column, index) => (
                                    <div key={index} className="grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 lg:grid-cols-[1fr_1fr_0.8fr_auto_auto]">
                                        <Input
                                            value={column.displayName}
                                            onChange={(event) =>
                                                setTableForm((current) => ({
                                                    ...current,
                                                    columns: current.columns.map((item, itemIndex) => itemIndex === index ? { ...item, displayName: event.target.value } : item),
                                                }))
                                            }
                                            placeholder="Display name"
                                        />
                                        <Input
                                            value={column.columnName}
                                            onChange={(event) =>
                                                setTableForm((current) => ({
                                                    ...current,
                                                    columns: current.columns.map((item, itemIndex) => itemIndex === index ? { ...item, columnName: event.target.value } : item),
                                                }))
                                            }
                                            placeholder="column_name"
                                        />
                                        <Select
                                            value={column.type}
                                            onValueChange={(value) =>
                                                setTableForm((current) => ({
                                                    ...current,
                                                    columns: current.columns.map((item, itemIndex) => itemIndex === index ? { ...item, type: value as InternalColumn["type"] } : item),
                                                }))
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {columnTypeOptions.map((option) => (
                                                    <SelectItem key={option} value={option}>{option}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <label className="flex items-center gap-2 text-sm text-slate-200">
                                            <Switch
                                                checked={column.required}
                                                onCheckedChange={(checked) =>
                                                    setTableForm((current) => ({
                                                        ...current,
                                                        columns: current.columns.map((item, itemIndex) => itemIndex === index ? { ...item, required: checked } : item),
                                                    }))
                                                }
                                            />
                                            Required
                                        </label>
                                        <label className="flex items-center gap-2 text-sm text-slate-200">
                                            <Switch
                                                checked={column.unique}
                                                onCheckedChange={(checked) =>
                                                    setTableForm((current) => ({
                                                        ...current,
                                                        columns: current.columns.map((item, itemIndex) => itemIndex === index ? { ...item, unique: checked } : item),
                                                    }))
                                                }
                                            />
                                            Unique
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setTableDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreateTable}>Create table</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={columnDialogOpen} onOpenChange={setColumnDialogOpen}>
                    <DialogContent className="border-white/10 bg-[#05101a] text-white">
                        <DialogHeader>
                            <DialogTitle>Add column</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-2">
                            <Input value={columnForm.displayName} onChange={(event) => setColumnForm((current) => ({ ...current, displayName: event.target.value }))} placeholder="Display name" />
                            <Input value={columnForm.columnName} onChange={(event) => setColumnForm((current) => ({ ...current, columnName: event.target.value }))} placeholder="column_name" />
                            <Select value={columnForm.type} onValueChange={(value) => setColumnForm((current) => ({ ...current, type: value as InternalColumn["type"] }))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {columnTypeOptions.map((option) => (
                                        <SelectItem key={option} value={option}>{option}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Input value={columnForm.defaultValue} onChange={(event) => setColumnForm((current) => ({ ...current, defaultValue: event.target.value }))} placeholder="Default value (optional)" />
                            <label className="flex items-center gap-2 text-sm text-slate-200">
                                <Switch checked={columnForm.required} onCheckedChange={(checked) => setColumnForm((current) => ({ ...current, required: checked }))} />
                                Required
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-200">
                                <Switch checked={columnForm.unique} onCheckedChange={(checked) => setColumnForm((current) => ({ ...current, unique: checked }))} />
                                Unique
                            </label>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setColumnDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleAddColumn}>Add column</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={relationshipDialogOpen} onOpenChange={setRelationshipDialogOpen}>
                    <DialogContent className="border-white/10 bg-[#05101a] text-white">
                        <DialogHeader>
                            <DialogTitle>Create relationship</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-2">
                            <Select value={relationshipForm.sourceEntityId} onValueChange={(value) => setRelationshipForm((current) => ({ ...current, sourceEntityId: value }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Source table" />
                                </SelectTrigger>
                                <SelectContent>
                                    {workspace?.entities?.map((entity) => (
                                        <SelectItem key={entity.id} value={entity.id}>{entity.displayName}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={relationshipForm.type} onValueChange={(value) => setRelationshipForm((current) => ({ ...current, type: value as InternalRelationship["type"] }))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ONE_TO_MANY">ONE_TO_MANY</SelectItem>
                                    <SelectItem value="MANY_TO_ONE">MANY_TO_ONE</SelectItem>
                                    <SelectItem value="ONE_TO_ONE">ONE_TO_ONE</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={relationshipForm.targetEntityId} onValueChange={(value) => setRelationshipForm((current) => ({ ...current, targetEntityId: value }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Target table" />
                                </SelectTrigger>
                                <SelectContent>
                                    {workspace?.entities?.map((entity) => (
                                        <SelectItem key={entity.id} value={entity.id}>{entity.displayName}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Input value={relationshipForm.sourceColumn} onChange={(event) => setRelationshipForm((current) => ({ ...current, sourceColumn: event.target.value }))} placeholder="source_column (example: customer_id)" />
                            <Input value={relationshipForm.targetColumn} onChange={(event) => setRelationshipForm((current) => ({ ...current, targetColumn: event.target.value }))} placeholder="target_column (default: id)" />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setRelationshipDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreateRelationship}>Create relationship</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
