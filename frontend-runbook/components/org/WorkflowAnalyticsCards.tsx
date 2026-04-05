'use client';

import {
    CheckCircle,
    Loader,
    Workflow,
    XCircle,
    type LucideIcon,
} from "lucide-react";

export type WorkflowAnalytics = {
    totalRuns: number;
    successRuns: number;
    failedRuns: number;
    runningRuns: number;
};

type AnalyticsCard = {
    key: keyof WorkflowAnalytics;
    label: string;
    icon: LucideIcon;
    iconClassName: string;
    gradientClassName: string;
};

const cards: AnalyticsCard[] = [
    {
        key: "totalRuns",
        label: "Total Workflow Runs",
        icon: Workflow,
        iconClassName: "text-sky-300",
        gradientClassName: "from-sky-500/20 via-sky-500/5 to-transparent",
    },
    {
        key: "successRuns",
        label: "Successful Runs",
        icon: CheckCircle,
        iconClassName: "text-emerald-300",
        gradientClassName: "from-emerald-500/20 via-emerald-500/5 to-transparent",
    },
    {
        key: "failedRuns",
        label: "Failed Runs",
        icon: XCircle,
        iconClassName: "text-rose-300",
        gradientClassName: "from-rose-500/20 via-rose-500/5 to-transparent",
    },
    {
        key: "runningRuns",
        label: "Currently Running",
        icon: Loader,
        iconClassName: "text-amber-300",
        gradientClassName: "from-amber-500/20 via-amber-500/5 to-transparent",
    },
];

const numberFormatter = new Intl.NumberFormat("en-US");

export function WorkflowAnalyticsCards({
    analytics,
}: {
    analytics: WorkflowAnalytics;
}) {
    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => {
                const Icon = card.icon;

                return (
                    <article
                        key={card.key}
                        className={`relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-6 transition hover:border-white/20 hover:bg-white/10 ${card.gradientClassName} bg-gradient-to-br`}
                    >
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_34%)]" />

                        <div className="relative flex items-start justify-between gap-4">
                            <div>
                                <p className="text-sm font-medium text-slate-300">
                                    {card.label}
                                </p>
                                <p className="mt-4 text-3xl font-semibold tracking-tight text-white">
                                    {numberFormatter.format(analytics[card.key])}
                                </p>
                            </div>

                            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-black/20">
                                <Icon
                                    className={`${card.iconClassName} ${card.key === "runningRuns" ? "animate-spin [animation-duration:4s]" : ""}`}
                                    size={20}
                                />
                            </div>
                        </div>
                    </article>
                );
            })}
        </div>
    );
}
