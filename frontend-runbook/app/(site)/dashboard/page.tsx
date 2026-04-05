import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Chat from "./components/chat/Chat";
import prisma from "@/lib/prisma";

export default async function DashboardPage() {
    const session: any = await getServerSession();

    if (!session) {
        redirect("/login");
    }

    const user: any = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
            memberships: true,
        },
    });

    if (!user) {
        redirect("/login");
    }

    const orgs = user.memberships;

    // 0 orgs → onboarding
    if (orgs.length === 0) {
        redirect("/org/create-org");
    }

    // 1 org → direct entry
    if (orgs.length === 1) {
        redirect(`/org/${orgs[0].organizationId}`);
    }

    // multiple orgs → selection
    redirect("/org/select-org");

    return (
        <div className="p-10 text-neutral-200 font-extralight w-full space-y-6 h-full">
            <Chat />
        </div>
    );
}
