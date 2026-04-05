"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

export default function CreateOrgPage() {
    const [name, setName] = useState("");
    const router = useRouter();
    const session = useSession();

    async function createOrg() {
        const url = `${process.env.NEXT_PUBLIC_SPRING_API_ENDPOINT}/orgs`;
        const res = await fetch(url, {
            method: "POST",
            body: JSON.stringify({ name, email: session.data?.user?.email }),
            headers: {
                "Content-Type": "application/json",
            },
        });

        const data = await res.json();
        if (!res.ok) {
            toast.error("Error creating organization", {
                description: data.message || "An unknown error occurred.",
                position: "top-right",
            });
            return;
        }

        router.push(`/org/${data}`);
    }

    return (
        <div className="relative flex min-h-full items-center justify-center overflow-hidden px-6 py-10">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.12),transparent_24%)]" />

            <div className="app-panel-elevated relative z-10 w-full max-w-lg p-8">
                <div className="mb-8">
                    <p className="app-kicker">Workspace Setup</p>
                    <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
                        Create organization
                    </h1>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        Start a workspace for operators, analysts, and engineers to collaborate on automation safely.
                    </p>
                </div>

                <div className="space-y-5">
                    <div className="space-y-2">
                        <label className="app-kicker !tracking-[0.18em]">Organization name</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Acme Enterprise"
                        />
                    </div>

                    <Button onClick={createOrg} disabled={!name.trim()} className="w-full" size="lg">
                        Create workspace
                    </Button>
                </div>

                <p className="mt-6 text-sm text-muted-foreground">
                    You can invite team members and connect systems after the workspace is created.
                </p>
            </div>
        </div>
    );
}
