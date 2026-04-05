'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Workflow = {
    id: string;
    name: string;
    status: "DRAFT" | "ACTIVE";
    updatedAt: string;
};

export default function WorkflowListPage() {
    const { orgId } = useParams<{ orgId: string }>();

    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!orgId) return;

        const controller = new AbortController();

        async function fetchWorkflows() {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_SPRING_API_ENDPOINT}/workflow?orgId=${orgId}`, {
                    method: "GET",
                });
                const data = await res.json();
                if (!res.ok) {
                    throw new Error("Failed to fetch workflows");
                }

                setWorkflows(data);
            } catch (err) {
                if ((err as any).name !== "AbortError") {
                    console.error(err);
                }
            } finally {
                setLoading(false);
            }
        }

        fetchWorkflows();

        return () => controller.abort();
    }, [orgId]);

    return (
        <div className="app-page">
            <div className="app-page-inner">
                <div className="app-page-header">
                    <div>
                        <p className="app-kicker">Automation</p>
                        <h1 className="app-title mt-3">Workflows</h1>
                        <p className="app-subtitle mt-2">
                            Monitor every automation definition in this workspace and move quickly between drafts and active flows.
                        </p>
                    </div>

                    <Link href={`/org/${orgId}/workflows/new`}>
                        <Button>Create workflow</Button>
                    </Link>
                </div>

                {loading && (
                    <div className="app-panel p-5 text-sm text-muted-foreground">
                        Loading workflows...
                    </div>
                )}

                {!loading && workflows.length === 0 && (
                    <div className="app-empty">
                        <p className="text-sm font-medium text-foreground">No workflows yet</p>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Create your first workflow to start automating operational processes.
                        </p>
                    </div>
                )}

                {!loading && workflows.length > 0 && (
                    <div className="app-panel overflow-hidden">
                        <table className="app-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Status</th>
                                    <th>Updated</th>
                                    <th className="text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {workflows.map((wf) => (
                                    <tr key={wf.id}>
                                        <td>
                                            <div>
                                                <p className="font-medium text-foreground">{wf.name}</p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    Workflow ID: {wf.id}
                                                </p>
                                            </div>
                                        </td>
                                        <td>
                                            <span
                                                className={`app-badge ${
                                                    wf.status === "ACTIVE"
                                                        ? "border-[rgba(34,197,94,0.2)] bg-success-soft text-success"
                                                        : "border-border bg-secondary text-muted-foreground"
                                                }`}
                                            >
                                                {wf.status}
                                            </span>
                                        </td>
                                        <td className="text-muted-foreground">
                                            {new Date(wf.updatedAt).toLocaleDateString()}
                                        </td>
                                        <td className="text-right">
                                            <Link
                                                href={`/org/${orgId}/workflows/${wf.id}`}
                                                className="text-sm font-medium text-primary transition hover:text-[#7C7FFF]"
                                            >
                                                Edit workflow
                                            </Link>
                                        </td>
                                    </tr>
                                ))}

                                
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
