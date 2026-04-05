'use client';
import TopBar from "./Topbar";
import { AppSidebar } from "./Appsidebar";
import { ReactNode, useState } from "react";

export default function DashboardShell({ children }: { children: ReactNode }) {
    const [mode, setMode] = useState<"ask" | "build">("ask");

    return (
        <div className="relative h-screen w-screen overflow-hidden bg-background text-foreground">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.12),transparent_24%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_18%)]" />

            <div className="relative flex h-full w-full flex-col">
                <TopBar mode={mode} onModeChange={setMode} />

                <div className="flex w-full flex-1 overflow-hidden">
                    <AppSidebar />
                    <div className="flex-1 overflow-hidden">
                        <div className="h-full overflow-hidden p-3 md:p-4">
                            <div className="h-full overflow-hidden rounded-xl border border-border bg-card/40 shadow-[0_1px_2px_rgba(0,0,0,0.35)]">
                                {children}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
