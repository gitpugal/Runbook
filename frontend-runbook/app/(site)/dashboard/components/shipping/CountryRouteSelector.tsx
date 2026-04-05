"use client";

import { useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowRight, RotateCcw } from "lucide-react";

interface CountryRouteSelectorProps {
    countries: string[];
    onFind: (from: string, to: string) => void;
    onClear: () => void;
}

export default function CountryRouteSelector({
    countries,
    onFind,
    onClear,
}: CountryRouteSelectorProps) {
    const [from, setFrom] = useState<string | null>(null);
    const [to, setTo] = useState<string | null>(null);

    return (
        <div
            className="
        flex flex-wrap items-end gap-3
        rounded-xl border border-white/10
        bg-white/5 p-4
        backdrop-blur-xl
        shadow-inner
      "
        >
            {/* Export */}
            <div className="flex flex-col gap-1">
                <label className="text-xs text-white/60">Export Country</label>
                <Select value={from ?? ''} onValueChange={setFrom}>
                    <SelectTrigger className="w-[180px] bg-[#0b1625] border-white/10 text-white">
                        <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0b1625] border-white/10">
                        {countries.map((c) => (
                            <SelectItem key={c} value={c}>
                                {c}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Arrow */}
            <div className="mb-1 flex h-9 items-center justify-center text-white/40">
                <ArrowRight size={16} />
            </div>

            {/* Import */}
            <div className="flex flex-col gap-1">
                <label className="text-xs text-white/60">Import Country</label>
                <Select value={to ?? ''} onValueChange={setTo}>
                    <SelectTrigger className="w-[180px] bg-[#0b1625] border-white/10 text-white">
                        <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0b1625] border-white/10">
                        {countries.map((c) => (
                            <SelectItem key={c} value={c}>
                                {c}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Actions */}
            <div className="ml-auto flex gap-2">
                <Button
                    size="sm"
                    disabled={!from || !to}
                    onClick={() => onFind(from!, to!)}
                    className="
            bg-cyan-500/20
            text-cyan-300
            hover:bg-cyan-500/30
            border border-cyan-400/30
          "
                >
                    Find Routes
                </Button>

                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                        setFrom(null);
                        setTo(null);
                        onClear();
                    }}
                    className="text-white/60 hover:text-white"
                >
                    <RotateCcw size={14} className="mr-1" />
                    Clear
                </Button>
            </div>
        </div>
    );
}
