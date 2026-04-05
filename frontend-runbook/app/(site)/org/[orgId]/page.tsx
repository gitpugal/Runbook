'use client';

import { WorkflowAnalyticsCards, type WorkflowAnalytics } from "@/components/org/WorkflowAnalyticsCards";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Activity, ArrowRight, Clock3, GitBranch, Plus } from "lucide-react";
import { useEffect, useState } from "react";

type Workflow = {
    id: string;
    name: string;
    status: "DRAFT" | "ACTIVE" | "ARCHIVED";
    updatedAt: string;
};

type WorkflowExecutionSummary = {
    id: string;
    workflowId: string;
    status: string;
    triggerType: string;
    startedAt: string | null;
    finishedAt: string | null;
    errorMessage?: string | null;
};

type RecentRun = WorkflowExecutionSummary & {
    workflowName: string;
};

const emptyAnalytics: WorkflowAnalytics = {
    totalRuns: 0,
    successRuns: 0,
    failedRuns: 0,
    runningRuns: 0,
};

const statusStyles: Record<string, string> = {
    COMPLETED: "border-[rgba(34,197,94,0.2)] bg-success-soft text-success",
    SUCCESS: "border-[rgba(34,197,94,0.2)] bg-success-soft text-success",
    FAILED: "border-[rgba(239,68,68,0.24)] bg-error-soft text-[#fda4af]",
    RUNNING: "border-[rgba(245,158,11,0.24)] bg-warning-soft text-warning",
    PENDING: "border-[rgba(59,130,246,0.2)] bg-info-soft text-info",
};

function normalizeAnalytics(data: Partial<WorkflowAnalytics> | null | undefined): WorkflowAnalytics {
    return {
        totalRuns: Number(data?.totalRuns ?? 0),
        successRuns: Number(data?.successRuns ?? 0),
        failedRuns: Number(data?.failedRuns ?? 0),
        runningRuns: Number(data?.runningRuns ?? 0),
    };
}

function formatRunTimestamp(value: string | null) {
    if (!value) {
        return "In progress";
    }

    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    }).format(new Date(value));
}

function getRunSortValue(run: WorkflowExecutionSummary) {
    const referenceTime = run.startedAt ?? run.finishedAt;
    return referenceTime ? new Date(referenceTime).getTime() : 0;
}

export default function OrgHomePage() {
    const { orgId } = useParams<{ orgId: string }>();

    const [analytics, setAnalytics] = useState<WorkflowAnalytics>(emptyAnalytics);
    const [analyticsLoading, setAnalyticsLoading] = useState(true);
    const [analyticsError, setAnalyticsError] = useState<string | null>(null);
    const [recentRuns, setRecentRuns] = useState<RecentRun[]>([]);
    const [recentRunsLoading, setRecentRunsLoading] = useState(true);
    const [recentRunsError, setRecentRunsError] = useState<string | null>(null);

    const actions = [
        {
            title: "Create workflow",
            description: "Design a new automation process and move directly into the canvas.",
            href: `/org/${orgId}/workflows/new`,
            icon: Plus,
        },
        {
            title: "View workflows",
            description: "Inspect, edit, and manage existing workflow definitions for this workspace.",
            href: `/org/${orgId}/workflows`,
            icon: GitBranch,
        },
    ];

    useEffect(() => {
        if (!orgId) {
            return;
        }

        const controller = new AbortController();

        async function fetchAnalytics() {
            try {
                setAnalyticsLoading(true);
                setAnalyticsError(null);

                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_SPRING_API_ENDPOINT}/org/${orgId}/workflow-analytics`,
                    {
                        signal: controller.signal,
                    }
                );

                if (!response.ok) {
                    throw new Error("Failed to fetch workflow analytics");
                }

                const data = await response.json();
                setAnalytics(normalizeAnalytics(data));
            } catch (error) {
                if ((error as Error).name === "AbortError") {
                    return;
                }

                console.error(error);
                setAnalytics(emptyAnalytics);
                setAnalyticsError("Workflow analytics are unavailable right now.");
            } finally {
                setAnalyticsLoading(false);
            }
        }

        fetchAnalytics();

        return () => controller.abort();
    }, [orgId]);

    useEffect(() => {
        if (!orgId) {
            return;
        }

        const controller = new AbortController();

        async function fetchRecentRuns() {
            try {
                setRecentRunsLoading(true);
                setRecentRunsError(null);

                const workflowResponse = await fetch(
                    `${process.env.NEXT_PUBLIC_SPRING_API_ENDPOINT}/workflow?orgId=${orgId}`,
                    {
                        signal: controller.signal,
                    }
                );

                if (!workflowResponse.ok) {
                    throw new Error("Failed to fetch workflows");
                }

                const workflows: Workflow[] = await workflowResponse.json();

                if (workflows.length === 0) {
                    setRecentRuns([]);
                    return;
                }

                const executionResults = await Promise.allSettled(
                    workflows.map(async (workflow) => {
                        const response = await fetch(
                            `${process.env.NEXT_PUBLIC_SPRING_API_ENDPOINT}/workflow/${workflow.id}/executions`,
                            {
                                signal: controller.signal,
                            }
                        );

                        if (!response.ok) {
                            throw new Error(`Failed to fetch executions for workflow ${workflow.id}`);
                        }

                        const executions: WorkflowExecutionSummary[] = await response.json();

                        return executions.slice(0, 5).map((execution) => ({
                            ...execution,
                            workflowName: workflow.name,
                        }));
                    })
                );

                const latestRuns = executionResults
                    .flatMap((result) => {
                        if (result.status === "fulfilled") {
                            return result.value;
                        }

                        console.error(result.reason);
                        return [];
                    })
                    .sort((left, right) => getRunSortValue(right) - getRunSortValue(left))
                    .slice(0, 5);

                setRecentRuns(latestRuns);
            } catch (error) {
                if ((error as Error).name === "AbortError") {
                    return;
                }

                console.error(error);
                setRecentRuns([]);
                setRecentRunsError("Recent workflow runs could not be loaded.");
            } finally {
                setRecentRunsLoading(false);
            }
        }

        fetchRecentRuns();

        return () => controller.abort();
    }, [orgId]);

    return (
        <div className="app-page">
            <div className="app-page-inner">
                <div className="app-page-header">
                    <div>
                        <p className="app-kicker">Workspace Overview</p>
                        <h1 className="app-title mt-3">Organization dashboard</h1>
                        <p className="app-subtitle mt-2">
                            Track automation health, review the latest workflow activity.
                        </p>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                        {actions.map((action) => (
                            <Link
                                key={action.title}
                                href={action.href}
                                className="
      group
      flex items-center justify-center gap-2
      rounded-lg
      border border-blue-500/30
      bg-blue-600/90
      px-4 py-2.5
      text-sm font-semibold
      text-white
      transition-all duration-200
      hover:bg-blue-500
      hover:border-blue-400
      hover:shadow-lg hover:shadow-blue-900/30
      active:scale-[0.97]
      focus:outline-none focus:ring-2 focus:ring-blue-400/40
      "
                            >
                                <action.icon
                                    size={14}
                                    className="transition group-hover:scale-110"
                                />

                                <span>{action.title}</span>
                            </Link>
                        ))}
                    </div>
                </div>

                <section className="app-panel p-6">
                    <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="app-kicker !tracking-[0.18em]">Workflow analytics</p>
                            <p className="mt-2 text-sm text-muted-foreground">
                                A live snapshot of workflow activity across this organization.
                            </p>
                        </div>

                        {analyticsError && (
                            <p className="text-sm text-muted-foreground">{analyticsError}</p>
                        )}
                    </div>

                    <div className="mt-5">
                        {analyticsLoading ? (
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                                {Array.from({ length: 4 }).map((_, index) => (
                                    <div
                                        key={index}
                                        className="h-36 animate-pulse rounded-xl border border-white/10 bg-white/5"
                                    />
                                ))}
                            </div>
                        ) : (
                            <WorkflowAnalyticsCards analytics={analytics} />
                        )}
                    </div>
                </section>

                <section className="app-panel overflow-hidden">
                    <div className="app-panel-header">
                        <div>
                            <p className="app-kicker !tracking-[0.18em]">Recent activity</p>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Latest workflow run activity across your workspace.
                            </p>
                        </div>

                        <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 md:flex">
                            <Activity size={14} />
                            Latest 5 runs
                        </div>
                    </div>

                    <div className="app-panel-body">
                        {recentRunsLoading && (
                            <div className="space-y-3">
                                {Array.from({ length: 5 }).map((_, index) => (
                                    <div
                                        key={index}
                                        className="h-20 animate-pulse rounded-xl border border-white/10 bg-white/5"
                                    />
                                ))}
                            </div>
                        )}

                        {!recentRunsLoading && recentRuns.length === 0 && (
                            <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-5 py-8 text-sm text-muted-foreground">
                                {recentRunsError ?? "No workflow runs have been recorded yet."}
                            </div>
                        )}

                        {!recentRunsLoading && recentRuns.length > 0 && (
                            <div className="space-y-3">
                                {recentRuns.map((run) => (
                                    <div
                                        key={run.id}
                                        className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 transition hover:border-white/20 hover:bg-white/[0.06] md:flex-row md:items-center md:justify-between"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-foreground">
                                                {run.workflowName}
                                            </p>
                                            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                                <span className="inline-flex items-center gap-2">
                                                    <Clock3 size={13} />
                                                    {formatRunTimestamp(run.startedAt)}
                                                </span>
                                                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-slate-300">
                                                    {run.triggerType}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {run.errorMessage && (
                                                <p className="hidden max-w-xs truncate text-xs text-rose-300 xl:block">
                                                    {run.errorMessage}
                                                </p>
                                            )}

                                            <span className={`app-badge ${statusStyles[run.status] ?? "border-border bg-secondary text-muted-foreground"}`}>
                                                {run.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

            </div>
        </div>
    );
}
