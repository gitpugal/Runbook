"use client";

import { useState } from "react";

export default function RouteControls({
    countries,
    onFind,
    onClear,
}: {
    countries: string[];
    onFind: (from: string, to: string) => void;
    onClear: () => void;
}) {
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");

    return (
        <div className="flex gap-2 items-end bg-white/5 p-3 rounded-lg border border-white/10">
            <div>
                <label className="text-xs text-white/60">Export</label>
                <select
                    className="bg-[#0b1625] text-white text-sm rounded px-2 py-1"
                    onChange={(e) => setFrom(e.target.value)}
                >
                    <option />
                    {countries.map(c => <option key={c}>{c}</option>)}
                </select>
            </div>

            <div>
                <label className="text-xs text-white/60">Import</label>
                <select
                    className="bg-[#0b1625] text-white text-sm rounded px-2 py-1"
                    onChange={(e) => setTo(e.target.value)}
                >
                    <option />
                    {countries.map(c => <option key={c}>{c}</option>)}
                </select>
            </div>

            <button
                onClick={() => onFind(from, to)}
                className="px-3 py-1.5 text-xs rounded bg-cyan-500/20 text-cyan-300"
            >
                Find Routes
            </button>

            <button
                onClick={onClear}
                className="px-3 py-1.5 text-xs rounded bg-white/10 text-white/70"
            >
                Clear
            </button>
        </div>
    );
}
