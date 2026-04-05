"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function OrgInvitationsPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const userEmail = session?.user?.email;

    const [invites, setInvites] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userEmail) return;

        async function fetchInvites() {
            try {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_SPRING_API_ENDPOINT}/invitations/received?email=${encodeURIComponent(userEmail || "")}`,
                );

                if (!res.ok) throw new Error("Failed to fetch invites");
                setInvites(await res.json());
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        fetchInvites();
    }, [userEmail]);

    async function acceptInvite(inviteId: string, orgId: string) {
        if (!userEmail) return;

        await fetch(
            `${process.env.NEXT_PUBLIC_SPRING_API_ENDPOINT}/invitations/${inviteId}/accept?email=${encodeURIComponent(userEmail)}`,
            { method: "POST" },
        );

        router.push(`/org/${orgId}`);
    }

    async function rejectInvite(inviteId: string) {
        if (!userEmail) return;

        await fetch(
            `${process.env.NEXT_PUBLIC_SPRING_API_ENDPOINT}/invitations/${inviteId}/reject?email=${encodeURIComponent(userEmail)}`,
            { method: "POST" },
        );

        setInvites((prev) => prev.filter((inv) => inv.id !== inviteId));
    }

    return (
        <div className="app-page">
            <div className="app-page-inner max-w-4xl">
                <div className="app-page-header">
                    <div>
                        <p className="app-kicker">System</p>
                        <h1 className="app-title mt-3">Organization invitations</h1>
                        <p className="app-subtitle mt-2">
                            Review pending workspace access requests and route each invite to the right team.
                        </p>
                    </div>
                </div>

                {loading && (
                    <div className="app-panel p-5 text-sm text-muted-foreground">
                        Loading invitations...
                    </div>
                )}

                {!loading && invites.length === 0 && (
                    <div className="app-empty text-sm text-muted-foreground">
                        You do not have any pending invitations.
                    </div>
                )}

                <div className="space-y-4">
                    {invites.map((invite) => (
                        <div
                            key={invite.id}
                            className="app-panel flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between"
                        >
                            <div>
                                <p className="text-base font-medium text-foreground">{invite.orgName}</p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Invited as {invite.role}
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <Button size="sm" onClick={() => acceptInvite(invite.id, invite.orgId)}>
                                    Accept
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => rejectInvite(invite.id)}
                                >
                                    Reject
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
