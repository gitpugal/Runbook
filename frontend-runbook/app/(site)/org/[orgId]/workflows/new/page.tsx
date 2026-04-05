"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

export default function CreateWorkflowPage() {
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { orgId } = useParams<{ orgId: string }>();
    const session = useSession();

    async function createWorkflow() {
        if (!name.trim() || !orgId) return;

        try {
            setLoading(true);
            const url = `${process.env.NEXT_PUBLIC_SPRING_API_ENDPOINT}/workflow`;
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, orgId, email: session.data?.user?.email }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error("Error creating workflow", {
                    description: data.message || "An unknown error occurred.",
                    position: "top-right",
                });
                return;
            }

            router.push(`/org/${orgId}/workflows/${data.id}`);
        } catch (err) {
            toast.error("Error creating workflow", {
                description: (err as any).message || "An unknown error occurred.",
                position: "top-right",
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="app-page flex items-center justify-center">
            <div className="app-panel-elevated w-full max-w-xl p-8">
                <p className="app-kicker">Automation</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
                    Create workflow
                </h1>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Give your workflow a clear name before moving into the builder canvas.
                </p>

                <div className="mt-8 space-y-5">
                    <div className="space-y-2">
                        <label className="app-kicker !tracking-[0.18em]">Workflow name</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Order fulfillment"
                        />
                    </div>

                    <Button
                        className="w-full"
                        disabled={!name.trim() || loading}
                        onClick={createWorkflow}
                        size="lg"
                    >
                        {loading ? "Creating..." : "Continue to canvas"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
