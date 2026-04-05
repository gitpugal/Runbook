"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
    BellRing,
    Braces,
    DatabaseZap,
    GitBranch,
    GitMerge,
    IterationCcw,
    PlaySquare,
    Table2,
    WandSparkles,
} from "lucide-react";

const NODE_TYPES = [
    { type: "DATA_FETCH", label: "Data Fetch", description: "Read data from a table", icon: Table2 },
    { type: "CONDITION", label: "Condition", description: "Filter rows from previous node", icon: GitBranch },
    { type: "DATA_UPDATE", label: "Data Update", description: "Update rows in a table", icon: DatabaseZap },
    { type: "TOOL_TRIGGER", label: "Tool Trigger", description: "Invoke server-side action", icon: WandSparkles },
    { type: "DATA_TRIGGER", label: "Data Trigger", description: "Client web hook", icon: BellRing },
    { type: "WEBHOOK_TRIGGER", label: "Webhook Trigger", description: "Start from an HTTP payload", icon: Braces },
    // { type: "JOIN", label: "Join", description: "Wait for all incoming paths", icon: GitMerge },
    // { type: "LOOP", label: "Loop", description: "Run downstream once per packet", icon: IterationCcw },
];

export default function WorkflowSidebar({ data, setData, session }: { data: any; setData: (data: any) => void; session: any }) {
    const { workFlowId, orgId } = useParams<{ workFlowId: string; orgId: string }>();
    const router = useRouter();

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const onDragStart = (event: React.DragEvent, nodeType: string) => {
        event.dataTransfer.setData("nodeType", nodeType);
        event.dataTransfer.effectAllowed = "move";
    };

    async function updateWorkflow() {
        if (!data?.name?.trim()) return;

        try {
            setIsSaving(true);
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_SPRING_API_ENDPOINT}/workflow/${workFlowId}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: data.name.trim(),
                        email: session?.user?.email || "",
                        scheduled: data.scheduled,
                        cronString: `${data?.cronSecond ?? "*"} ${data?.cronMinute ?? "*"} ${data?.cronHour ?? "*"} ${data?.cronDay ?? "*"} ${data?.cronMonth ?? "*"} ${data?.cronWeekDay ?? "*"}`,
                    }),
                },
            );

            if (!res.ok) throw new Error("Failed to update workflow");

            toast.success("Workflow updated");
            setIsSettingsOpen(false);
        } catch (err) {
            toast.error("Update failed");
        } finally {
            setIsSaving(false);
        }
    }

    async function deleteWorkflow() {
        if (!confirm("Are you sure you want to delete this workflow? This cannot be undone.")) return;

        try {
            setIsDeleting(true);
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_SPRING_API_ENDPOINT}/workflow/${workFlowId}`,
                { method: "DELETE" },
            );

            if (!res.ok) throw new Error("Failed to delete");

            toast.success("Workflow deleted");
            router.push(`/org/${orgId}/workflows`);
        } catch (err) {
            toast.error("Delete failed");
        } finally {
            setIsDeleting(false);
        }
    }

    useEffect(() => {
        if (!data?.cronString) return;

        const parts = data.cronString.split(" ");
        console.log("Parsed cron parts:", parts);
        if (parts.length == 6) {
            setData((prev: any) => ({
                ...prev,
                cronSecond: parts[0],
                cronMinute: parts[1],
                cronHour: parts[2],
                cronDay: parts[3],
                cronMonth: parts[4],
                cronWeekDay: parts[5],
            }));
        }
    }, [data?.cronString, setData]);

    return (
        <>
            <aside className="flex w-72 flex-col justify-between border-r border-border bg-sidebar overflow-y-scroll">
                <div className="flex flex-col gap-6 px-4 py-5">
                    <div className="rounded-xl border border-sidebar-border bg-[#131316] px-4 py-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#71717A]">
                            Workflow Builder
                        </p>
                        <p className="mt-2 text-sm font-semibold text-foreground">
                            Node library
                        </p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                            Drag components into the canvas to build execution logic.
                        </p>
                    </div>

                    <div>
                        <div className="mb-3 flex items-center justify-between px-1">
                            <div>
                                <p className="text-sm font-semibold text-foreground">Available nodes</p>
                                <p className="mt-1 text-xs text-muted-foreground">Reusable workflow building blocks</p>
                            </div>
                            <span className="app-badge border-border bg-secondary text-muted-foreground">
                                {NODE_TYPES.length}
                            </span>
                        </div>

                        <div className="space-y-2">
                            {NODE_TYPES.map((node) => (
                                <div
                                    key={node.type}
                                    draggable
                                    onDragStart={(e) => onDragStart(e, node.type)}
                                    className="group cursor-grab rounded-lg border border-border bg-secondary px-4 py-3 transition hover:border-primary/35 hover:bg-accent active:cursor-grabbing"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-md border border-border bg-[#141416] text-foreground transition group-hover:border-primary/30 group-hover:text-primary">
                                            <node.icon size={16} />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-sm font-medium text-foreground">{node.label}</div>
                                            <div className="mt-1 text-xs leading-5 text-muted-foreground">{node.description}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="border-t border-border px-4 py-4">

                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                            if (data?.cronString) {
                                const parts = data.cronString.split(" ");

                                if (parts.length === 6) {
                                    setData((prev: any) => ({
                                        ...prev,
                                        cronSecond: parts[0],
                                        cronMinute: parts[1],
                                        cronHour: parts[2],
                                        cronDay: parts[3],
                                        cronMonth: parts[4],
                                        cronWeekDay: parts[5],
                                    }));
                                }
                            }

                            setIsSettingsOpen(true);
                        }}
                    >
                        Settings
                    </Button>
                </div>
            </aside>

            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-scroll">
                    <DialogHeader>
                        <DialogTitle>Workflow settings</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-5 py-2">
                        <div className="space-y-2">
                            <Label>Workflow name</Label>
                            <Input
                                value={data?.name || ""}
                                onChange={(e) => setData((prev: any) => ({ ...prev, name: e.target.value }))}
                                placeholder="Enter workflow name"
                            />
                        </div>

                        <div className="flex items-center justify-between rounded-lg border border-border bg-secondary px-4 py-3">
                            <div>
                                <p className="text-sm font-medium text-foreground">Scheduled execution</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Enable recurring execution using a cron expression.
                                </p>
                            </div>
                            <Switch
                                checked={data?.scheduled || false}
                                onCheckedChange={(checked: boolean) => setData((prev: any) => ({ ...prev, scheduled: checked }))}
                            />
                        </div>

                        {data?.scheduled && (
                            <div className="rounded-lg border border-border bg-secondary p-4">
                                <div className="mb-4">
                                    <Label>Schedule time</Label>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Use cron parts for second, minute, hour, day, month, and weekday.
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <Input
                                        placeholder="Seconds"
                                        value={data?.cronSecond ?? ""}
                                        onChange={(e) =>
                                            setData((prev: any) => ({
                                                ...prev,
                                                cronSecond: e.target.value !== "" ? e.target.value : "*",
                                            }))
                                        }
                                    />
                                    <Input
                                        placeholder="Minute"
                                        value={data?.cronMinute ?? ""}
                                        onChange={(e) =>
                                            setData((prev: any) => ({
                                                ...prev,
                                                cronMinute: e.target.value !== "" ? e.target.value : "*",
                                            }))
                                        }
                                    />
                                    <Input
                                        placeholder="Hour"
                                        value={data?.cronHour ?? ""}
                                        onChange={(e) =>
                                            setData((prev: any) => ({
                                                ...prev,
                                                cronHour: e.target.value !== "" ? e.target.value : "*",
                                            }))
                                        }
                                    />
                                    <Input
                                        placeholder="Day of month (*)"
                                        value={data?.cronDay ?? "*"}
                                        onChange={(e) =>
                                            setData((prev: any) => ({
                                                ...prev,
                                                cronDay: e.target.value !== "" ? e.target.value : "*",
                                            }))
                                        }
                                    />
                                    <Input
                                        placeholder="Month (*)"
                                        value={data?.cronMonth ?? "*"}
                                        onChange={(e) =>
                                            setData((prev: any) => ({
                                                ...prev,
                                                cronMonth: e.target.value !== "" ? e.target.value : "*",
                                            }))
                                        }
                                    />
                                    <Input
                                        placeholder="Weekday (0-6)"
                                        value={data?.cronWeekDay ?? "*"}
                                        onChange={(e) =>
                                            setData((prev: any) => ({
                                                ...prev,
                                                cronWeekDay: e.target.value !== "" ? e.target.value : "*",
                                            }))
                                        }
                                    />
                                </div>

                                <div className="mt-4 rounded-md border border-border bg-[#101012] px-3 py-3 text-xs text-muted-foreground">
                                    <span className="font-medium text-foreground">Cron expression:</span>
                                    <span className="ml-2 font-mono text-[#A1A1AA]">
                                        {`${data?.cronSecond ? data?.cronSecond : "*"} ${data?.cronMinute ?? "*"} ${data?.cronHour ?? "*"} ${data?.cronDay ?? "*"} ${data?.cronMonth ?? "*"} ${data?.cronWeekDay ?? "*"}`}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="flex justify-between">
                        <Button
                            variant="destructive"
                            onClick={deleteWorkflow}
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Deleting..." : "Delete workflow"}
                        </Button>

                        <Button onClick={updateWorkflow} disabled={isSaving}>
                            {isSaving ? "Saving..." : "Save changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
