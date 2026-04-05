"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-10">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.14),transparent_28%)]" />
            <div className="pointer-events-none absolute inset-0 opacity-[0.04] bg-[linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] bg-[size:48px_48px]" />

            <div className="app-panel-elevated relative z-10 w-full max-w-md p-8">
                <div className="mb-8">
                    <p className="app-kicker">Enterprise SaaS</p>
                    <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
                        Sign in to Runbook
                    </h1>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        Access workflow orchestration, data pipelines, and operational tooling from one secure control plane.
                    </p>
                </div>

                <Button
                    onClick={() => signIn("google", { callbackUrl: "/org/select-org" })}
                    className="w-full"
                    size="lg"
                >
                    Continue with Google
                </Button>

                <div className="mt-6 flex items-center justify-between border-t border-border pt-5 text-xs text-muted-foreground">
                    <Link href="/" className="transition hover:text-foreground">
                        Back to home
                    </Link>
                    <span>Secure sign-in</span>
                </div>
            </div>
        </div>
    );
}
