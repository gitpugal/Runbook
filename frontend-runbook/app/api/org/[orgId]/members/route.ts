import { OrgRole } from "@/app/generated/prisma/enums";
import { requireUser } from "@/lib/auth";
import { requireOrgMember } from "@/lib/org";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";


export async function POST(req: Request, { params }: any) {
    const session = await getServerSession();
    if (!session?.user?.email) return new Response("Unauthorized", { status: 401 });

    const { email } = await req.json();

    const admin = await prisma.organizationMember.findFirst({
        where: {
            organizationId: params.orgId,
            user: { email: session.user.email },
            role: "ADMIN",
        },
    });

    if (!admin) return new Response("Forbidden", { status: 403 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return new Response("User not found", { status: 404 });

    await prisma.organizationMember.create({
        data: {
            userId: user.id,
            organizationId: params.orgId,
            role: OrgRole.WORKER,
        },
    });

    return new Response("OK");
}


export async function GET(
    req: Request,
    context: { params: Promise<{ orgId: string }> }
) {
    try {
        const { orgId } = await context.params;

        const user = await requireUser();
        await requireOrgMember(user.id, orgId);

        const members = await prisma.organizationMember.findMany({
            where: { organizationId: orgId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        image: true,
                    },
                },
            },
            orderBy: { joinedAt: "asc" },
        });

        return NextResponse.json({
            members: members.map((m) => ({
                id: m.id,
                role: m.role,
                joinedAt: m.joinedAt,
                user: m.user,
            })),
        });
    } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
}
