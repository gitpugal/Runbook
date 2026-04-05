import Link from "next/link";

export default function Sidebar() {
    return (
        <nav className="flex flex-col w-full p-6 space-y-6">
            <div className="text-sm tracking-[0.3em] text-neutral-400">
                RUNBOOK
            </div>

            <ul className="space-y-3 text-sm">
                <li>
                    <Link
                        href="/dashboard"
                        className="block rounded px-2 py-1 hover:bg-neutral-800"
                    >
                        Overview
                    </Link>
                </li>
                <li>
                    <Link
                        href="/dashboard/workflows"
                        className="block rounded px-2 py-1 hover:bg-neutral-800"
                    >
                        Workflows
                    </Link>
                </li>
                <li>
                    <Link
                        href="/dashboard/agents"
                        className="block rounded px-2 py-1 hover:bg-neutral-800"
                    >
                        Agents
                    </Link>
                </li>
                <li>
                    <Link
                        href="/dashboard/settings"
                        className="block rounded px-2 py-1 hover:bg-neutral-800"
                    >
                        Settings
                    </Link>
                </li>
            </ul>
        </nav>
    );
}
