import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function SelectOrgPage() {
    const session = await getServerSession();
    if (!session?.user?.email) redirect("/login");

    const userRes = await fetch(`${process.env.NEXT_PUBLIC_SPRING_API_ENDPOINT}/users/orgs?email=${session.user.email}`, {
        method: "GET",
    }).then((res) => res.json());

    const data = await userRes;

    if (!data || data.length === 0) {
        redirect("/org/create-org");
    }

    return (
        <div className="app-page relative overflow-x-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.12),transparent_22%)]" />
            <div className="app-page-inner relative z-10">
                <div className="app-page-header">
                    <div>
                        <p className="app-kicker">Workspace Access</p>
                        <h1 className="app-title mt-3">Select organization</h1>
                        <p className="app-subtitle mt-2">
                            Choose the workspace you want to manage. Each organization keeps workflows, users, and connections isolated.
                        </p>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {data.map((m: any) => (
                        <Link
                            key={m.organization_id}
                            href={`/org/${m.organization_id}`}
                            className="app-panel group p-6 transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-popover"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-secondary text-sm font-semibold uppercase text-foreground">
                                    {m.name.slice(0, 2)}
                                </div>
                                <span className="app-badge border-[rgba(59,130,246,0.2)] bg-info-soft text-info">
                                    {m.role}
                                </span>
                            </div>

                            <div className="mt-5">
                                <h2 className="text-base font-semibold text-foreground">{m.name}</h2>
                                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                    Production workspace for Enterprise workflows and team operations.
                                </p>
                            </div>

                            <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                <span>Workspace</span>
                                <span className="transition group-hover:text-foreground">Enter</span>
                            </div>
                        </Link>
                    ))}

                    
                </div>
            </div>
        </div>
    );
}
