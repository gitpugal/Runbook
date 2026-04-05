"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

type Tab = "org" | "members" | "invitations" | "databases";

const tabs: Tab[] = ["org", "members", "invitations", "databases"];

export default function OrgSettingsPage() {
    const { data: session } = useSession();
    const userEmail = session?.user?.email || "";
    const { orgId } = useParams<{ orgId: string }>();

    const [activeTab, setActiveTab] = useState<Tab>("org");
    const [orgData, setOrgData] = useState<any>(null);
    const [sentInvites, setSentInvites] = useState<any[]>([]);
    const [role, setRole] = useState<string>("");

    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("WORKER");
    const [isSendingInvite, setIsSendingInvite] = useState(false);

    const [databases, setDatabases] = useState<any[]>([]);
    const [isDbModalOpen, setIsDbModalOpen] = useState(false);

    const [dbName, setDbName] = useState("");
    const [dbType, setDbType] = useState("POSTGRES");
    const [dbHost, setDbHost] = useState("");
    const [dbPort, setDbPort] = useState("5432");
    const [dbUsername, setDbUsername] = useState("~");
    const [dbPassword, setDbPassword] = useState("");
    const [dbDatabase, setDbDatabase] = useState("");
    const [sapBaseUrl, setSapBaseUrl] = useState("");

    const [isTesting, setIsTesting] = useState(false);
    const [connectionValid, setConnectionValid] = useState<boolean | null>(null);

    useEffect(() => {
        if (!orgData?.members || !userEmail) return;
        const me = orgData.members.find((m: any) => m.email === userEmail);
        if (me) setRole(me.role);
    }, [orgData, userEmail]);

    useEffect(() => {
        if (!orgId) return;

        fetch(`${process.env.NEXT_PUBLIC_SPRING_API_ENDPOINT}/orgs/${orgId}`).then((r) => r.json()).then(setOrgData);
        fetch(`${process.env.NEXT_PUBLIC_SPRING_API_ENDPOINT}/orgs/${orgId}/invitations/sent`).then((r) => r.json()).then(setSentInvites);
        fetch(`${process.env.NEXT_PUBLIC_SPRING_API_ENDPOINT}/orgs/${orgId}/databases`).then((r) => r.json()).then(setDatabases);
    }, [orgId]);

    async function cancelInvite(inviteId: string) {
        await fetch(`${process.env.NEXT_PUBLIC_SPRING_API_ENDPOINT}/invitations/${inviteId}/cancel`, { method: "POST" });
        setSentInvites((prev) => prev.filter((i) => i.id !== inviteId));
    }

    async function testConnection() {
        setIsTesting(true);
        setConnectionValid(null);

        const payload =
            dbType === "SAP"
                ? {
                    type: "SAP",
                    baseUrl: sapBaseUrl,
                    username: dbUsername,
                    password: dbPassword,
                }
                : {
                    type: dbType,
                    host: dbHost,
                    port: dbPort,
                    username: dbUsername,
                    password: dbPassword,
                    database: dbDatabase,
                };

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_SPRING_API_ENDPOINT}/databases/test-connection`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const result = await res.json();
            if (result.success) {
                toast.success("Connection successful");
                setConnectionValid(true);
            } else {
                toast.error("Connection failed", { description: result.message });
                setConnectionValid(false);
            }
        } catch {
            toast.error("Connection test failed");
            setConnectionValid(false);
        } finally {
            setIsTesting(false);
        }
    }

    async function createDatabase() {
        if (!connectionValid) {
            toast.error("Please test connection before saving");
            return;
        }

        const payload =
            dbType === "SAP"
                ? {
                    name: dbName,
                    type: "SAP",
                    baseUrl: sapBaseUrl,
                    username: dbUsername,
                    password: dbPassword,
                }
                : {
                    name: dbName,
                    type: dbType,
                    host: dbHost,
                    port: dbPort,
                    username: dbUsername,
                    password: dbPassword,
                    database: dbDatabase,
                };

        const res = await fetch(`${process.env.NEXT_PUBLIC_SPRING_API_ENDPOINT}/orgs/${orgId}/databases`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const newDb = await res.json();
        setDatabases((prev) => [...prev, newDb]);
        setIsDbModalOpen(false);
    }

    async function deleteDatabase(dbId: string) {
        await fetch(`${process.env.NEXT_PUBLIC_SPRING_API_ENDPOINT}/databases/${dbId}`, { method: "DELETE" });
        setDatabases((prev) => prev.filter((d) => d.id !== dbId));
    }

    async function removeMember(userId: string) {
        const res = await fetch(`${process.env.NEXT_PUBLIC_SPRING_API_ENDPOINT}/orgs/${orgId}/members`, {
            method: "DELETE",
            body: JSON.stringify({ requesterEmail: userEmail, orgId: orgId, userId: userId }),
            headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) {
            toast.error("Failed to remove member", {
                description: (await res.json()).message || "An unknown error occurred.",
                position: "top-right",
            });
            return;
        }
        setOrgData((prev: any) => ({
            ...prev,
            members: prev.members.filter((m: any) => m.userId !== userId),
        }));
    }

    async function sendInvite() {
        if (!orgId || !inviteEmail) return;
        try {
            setIsSendingInvite(true);

            const res = await fetch(`${process.env.NEXT_PUBLIC_SPRING_API_ENDPOINT}/invitations/${orgId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: inviteEmail, role: inviteRole, sender: userEmail }),
            });

            if (!res.ok) {
                toast.error("Failed to send invite", {
                    description: (await res.json()).message || "An unknown error occurred.",
                    position: "top-right",
                });
                return;
            }

            const newInvite = await res.json();
            setSentInvites((prev) => [...prev, newInvite]);

            setInviteEmail("");
            setInviteRole("WORKER");
            setIsInviteOpen(false);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSendingInvite(false);
        }
    }

    return (
        <div className="app-page">
            <div className="app-page-inner">
                <div className="app-page-header">
                    <div>
                        <p className="app-kicker">Administration</p>
                        <h1 className="app-title mt-3">Organization settings</h1>
                        <p className="app-subtitle mt-2">
                            Manage workspace identity, members, invitations, and connected data systems without changing platform behavior.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`rounded-md border px-4 py-2 text-sm font-medium capitalize transition ${activeTab === tab
                                ? "border-primary/40 bg-primary/10 text-foreground"
                                : "border-border bg-secondary text-muted-foreground hover:bg-accent hover:text-foreground"
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {activeTab === "org" && (
                    <section className="app-panel max-w-4xl">
                        <div className="app-panel-header">
                            <div>
                                <p className="text-base font-semibold text-foreground">Organization</p>
                                <p className="mt-1 text-sm text-muted-foreground">Workspace identity and immutable metadata.</p>
                            </div>
                        </div>
                        <div className="app-panel-body app-form-grid">
                            <div className="space-y-2">
                                <Label>Name</Label>
                                <div className="rounded-[6px] border border-border bg-secondary px-3 py-3 text-sm text-foreground">
                                    {orgData?.name || "Loading..."}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Organization ID</Label>
                                <div className="rounded-[6px] border border-border bg-secondary px-3 py-3 text-sm text-muted-foreground">
                                    {orgId || "Loading..."}
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {activeTab === "members" && (
                    <section className="app-panel overflow-hidden">
                        <div className="app-panel-header">
                            <div>
                                <p className="text-base font-semibold text-foreground">Members</p>
                                <p className="mt-1 text-sm text-muted-foreground">Access control for users inside this workspace.</p>
                            </div>
                            <Button variant="outline" size="sm" disabled={role !== "ADMIN"} onClick={() => setIsInviteOpen(true)}>
                                Invite member
                            </Button>
                        </div>

                        <table className="app-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th className="text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orgData?.members?.map((member: any) => (
                                    <tr key={member.userId}>
                                        <td>
                                            <div>
                                                <p className="font-medium text-foreground">{member.email}</p>
                                                {userEmail === member.email && (
                                                    <p className="mt-1 text-xs text-success">Current user</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="text-muted-foreground">{member.role}</td>
                                        <td>
                                            <span className="app-badge border-[rgba(34,197,94,0.2)] bg-success-soft text-success">
                                                Active
                                            </span>
                                        </td>
                                        <td className="text-right">
                                            {userEmail !== member.email && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={role !== "ADMIN"}
                                                    onClick={() => removeMember(member.userId)}
                                                >
                                                    Remove
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>
                )}

                {activeTab === "invitations" && (
                    <section className="app-panel overflow-hidden">
                        <div className="app-panel-header">
                            <div>
                                <p className="text-base font-semibold text-foreground">Invitations</p>
                                <p className="mt-1 text-sm text-muted-foreground">Pending invitations that were sent from this workspace.</p>
                            </div>
                        </div>

                        {sentInvites.length === 0 ? (
                            <div className="app-panel-body text-sm text-muted-foreground">
                                No invitations sent
                            </div>
                        ) : (
                            <table className="app-table">
                                <thead>
                                    <tr>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th className="text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sentInvites.map((invite) => (
                                        <tr key={invite.id}>
                                            <td className="font-medium text-foreground">{invite.email}</td>
                                            <td className="text-muted-foreground">{invite.role}</td>
                                            <td className="text-right">
                                                <Button variant="outline" size="sm" onClick={() => cancelInvite(invite.id)}>
                                                    Cancel
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </section>
                )}

                {activeTab === "databases" && (
                    <section className="app-panel overflow-hidden">
                        <div className="app-panel-header">
                            <div>
                                <p className="text-base font-semibold text-foreground">Connected data sources</p>
                                <p className="mt-1 text-sm text-muted-foreground">Production integrations available to this organization.</p>
                            </div>
                            <Button size="sm" disabled={role !== "ADMIN"} onClick={() => setIsDbModalOpen(true)}>
                                Add connection
                            </Button>
                        </div>

                        {databases.length === 0 ? (
                            <div className="app-panel-body text-sm text-muted-foreground">
                                No connected systems yet.
                            </div>
                        ) : (
                            <table className="app-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Type</th>
                                        <th>Endpoint</th>
                                        <th className="text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {databases.map((db) => (
                                        <tr key={db.id}>
                                            <td className="font-medium text-foreground">{db.name}</td>
                                            <td className="text-muted-foreground">{db.type}</td>
                                            <td className="text-muted-foreground">
                                                {db.type === "SAP" ? db.baseUrl : `${db.host}:${db.port}`}
                                            </td>
                                            <td className="text-right">
                                                <span title={role !== "ADMIN" ? "You must be an admin" : ""}>
                                                    <Button
                                                        variant="outline"
                                                        disabled={role !== "ADMIN"}
                                                        size="sm"
                                                        onClick={() => deleteDatabase(db.id)}
                                                    >
                                                        Remove
                                                    </Button>
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </section>
                )}
            </div>

            <Dialog open={isDbModalOpen} onOpenChange={setIsDbModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add data source</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Connection name</Label>
                            <Input placeholder="ERP Primary" value={dbName} onChange={(e) => setDbName(e.target.value)} />
                        </div>

                        <div className="space-y-2">
                            <Label>Database type</Label>
                            <Select value={dbType} onValueChange={setDbType}>
                                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="POSTGRES">PostgreSQL</SelectItem>
                                    <SelectItem value="MYSQL">MySQL</SelectItem>
                                    <SelectItem value="MSSQL">SQL Server</SelectItem>
                                    <SelectItem value="SAP">SAP</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {dbType === "SAP" ? (
                            <>
                                <div className="space-y-2">
                                    <Label>SAP base URL</Label>
                                    <Input placeholder="https://sap.example.com" value={sapBaseUrl} onChange={(e) => setSapBaseUrl(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>API key</Label>
                                    <Input type="password" placeholder="********" value={dbPassword} onChange={(e) => setDbPassword(e.target.value)} />
                                </div>
                            </>
                        ) : (
                            <div className="app-form-grid">
                                <div className="space-y-2">
                                    <Label>Host</Label>
                                    <Input placeholder="db.internal" value={dbHost} onChange={(e) => setDbHost(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Port</Label>
                                    <Input placeholder="5432" value={dbPort} onChange={(e) => setDbPort(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Database name</Label>
                                    <Input placeholder="operations" value={dbDatabase} onChange={(e) => setDbDatabase(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Username</Label>
                                    <Input placeholder="service_user" value={dbUsername} onChange={(e) => setDbUsername(e.target.value)} />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label>Password</Label>
                                    <Input type="password" placeholder="********" value={dbPassword} onChange={(e) => setDbPassword(e.target.value)} />
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="flex justify-between">
                        <Button variant="outline" onClick={testConnection} disabled={isTesting}>
                            {isTesting ? "Testing..." : "Test connection"}
                        </Button>
                        <Button onClick={createDatabase} disabled={!connectionValid}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Invite member</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                                type="email"
                                placeholder="user@example.com"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Role</Label>
                            <Select value={inviteRole} onValueChange={setInviteRole}>
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                    <SelectItem value="WORKER">Worker</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsInviteOpen(false)}>Cancel</Button>
                        <Button onClick={sendInvite} disabled={isSendingInvite || !inviteEmail}>
                            {isSendingInvite ? "Sending..." : "Send invite"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
