import { OrgRole } from "@/app/generated/prisma/enums";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";



export async function POST(req: Request) {
    const session = await getServerSession();
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await req.json();

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    });

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const org = await prisma.organization.create({
        data: {
            name,
            members: {
                create: {
                    userId: user.id,
                    role: OrgRole.ADMIN,
                },
            },
        },
    });

    return NextResponse.json({ orgId: org.id });
}
