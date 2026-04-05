import { requireUser } from "@/lib/auth";
import { requireOrgMember } from "@/lib/org";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
    req: Request,
    context: { params: Promise<{ orgId: string }> }
) {
    const { orgId } = await context.params;
    const user = await requireUser();
    const membership = await requireOrgMember(user.id, orgId);

    if (membership.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { email, role } = await req.json();

    const invite = await prisma.orgInvite.create({
        data: {
            email,
            role,
            organizationId: orgId,
            invitedById: user.id,
        },
    });

    return NextResponse.json({ inviteId: invite.id });
}
