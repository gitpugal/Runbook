import prisma from "@/lib/prisma";

export default async function MembersPage({ params }: any) {
    const members = await prisma.organizationMember.findMany({
        where: { organizationId: params.orgId },
        include: { user: true },
    });

    return (
        <div>
            <h3>Members</h3>
            {members.map((m) => (
                <div key={m.id}>
                    {m.user.email} — {m.role}
                </div>
            ))}
        </div>
    );
}
