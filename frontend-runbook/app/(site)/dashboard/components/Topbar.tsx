"use client";

import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { SidebarTrigger } from "@/components/ui/sidebar";
import UserDropdown from "./UserDropdown";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

type Mode = "ask" | "build";

interface TopBarProps {
    mode: Mode;
    onModeChange: (mode: Mode) => void;
}

export default function TopBar({ mode }: TopBarProps) {
    const { data: session } = useSession();
    const router = useRouter();
    const userEmail = session?.user?.email;
    const [notifications, setNotifications] = useState<any[]>([]);

    useEffect(() => {
        if (!userEmail) return;

        async function fetchNotifications() {
            try {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_SPRING_API_ENDPOINT}/notifications?email=${encodeURIComponent(userEmail || "")}`,
                );

                if (res.ok) {
                    setNotifications(await res.json());
                } else {
                    alert("Failed to fetch notifications");
                    console.error("Failed to fetch notifications", await res.text());
                }
            } catch (err) {
                console.error("Failed to fetch notifications", err);
            }
        }

        fetchNotifications();
    }, [userEmail]);

    async function handleNotificationClick(n: any) {
        try {
            await fetch(
                `${process.env.NEXT_PUBLIC_SPRING_API_ENDPOINT}/notifications/${n.id}/read`,
                { method: "POST" },
            );

            setNotifications((prev) => prev.filter((x) => x.id !== n.id));

            if (n.type === "ORG_INVITE") {
                router.push("/org/invitations");
            }
        } catch (err) {
            console.error("Failed to mark notification as read", err);
        }
    }

    return (
        <header className="relative z-20 flex h-16 items-center justify-between border-b border-border bg-background/92 px-4 backdrop-blur-xl md:px-6">
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />

            <div className="flex items-center gap-3">
                <SidebarTrigger />
                <div className="flex items-center gap-3">
                    <Logo height={88} />
                    {/* <div className="hidden sm:block">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#71717A]">
                            Enterpise Workflow Automation
                        </p>
                        <p className="text-sm font-medium text-foreground">Runbook Control Plane</p>
                    </div> */}
                </div>
            </div>

            <div className="flex items-center gap-3">
                <Popover>
                    <PopoverTrigger asChild>
                        <button className="relative rounded-md border border-border bg-secondary p-2.5 text-muted-foreground transition hover:bg-accent hover:text-foreground">
                            <Bell size={16} />
                            {notifications.length > 0 && (
                                <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-destructive shadow-[0_0_0_3px_#0b0b0c]" />
                            )}
                        </button>
                    </PopoverTrigger>

                    <PopoverContent align="end" className="w-88 overflow-hidden p-0">
                        <div className="border-b border-border px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                Inbox
                            </p>
                            <p className="mt-1 text-sm font-semibold text-foreground">
                                Notifications
                            </p>
                        </div>

                        <ScrollArea className="max-h-80">
                            {notifications.length === 0 && (
                                <div className="p-5 text-sm text-muted-foreground">
                                    No new notifications
                                </div>
                            )}

                            {notifications.map((n) => (
                                <div
                                    key={n.id}
                                    onClick={() => handleNotificationClick(n)}
                                    className="cursor-pointer border-b border-[#1f1f23] px-4 py-3 transition hover:bg-accent"
                                >
                                    <p className="text-sm font-medium text-foreground">{n.title}</p>
                                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{n.message}</p>
                                </div>
                            ))}
                        </ScrollArea>
                    </PopoverContent>
                </Popover>



                <UserDropdown user={session?.user} />
            </div>
        </header>
    );
}
