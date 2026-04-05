"use client";

type DomainCardProps = {
    name: string;
    description?: string | null;
    tableCount: number;
};

export function DomainCard({ name, description, tableCount }: DomainCardProps) {
    return (
        <div className="rounded-2xl border border-white/10 bg-[linear-gradient(145deg,rgba(15,23,42,0.96),rgba(15,23,42,0.72))] p-5 shadow-[0_18px_60px_rgba(2,6,23,0.25)]">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-semibold text-white">{name}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                        {description?.trim() || "Add a description to help your team understand what belongs in this domain."}
                    </p>
                </div>

                <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
                    {tableCount} table{tableCount === 1 ? "" : "s"}
                </span>
            </div>
        </div>
    );
}
