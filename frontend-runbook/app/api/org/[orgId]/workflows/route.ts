import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { requireOrgMember } from "@/lib/org";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ orgId: string }> }
) {
    try {
        const user = await requireUser();
        const { orgId } = await params;
        await requireOrgMember(user.id, orgId);

        // Temporary stub until workflow model exists
        const workflows = await prisma.workflow.findMany({
            where: { organizationId: orgId },
            select: {
                id: true,
                name: true,
                status: true,
                updatedAt: true,
            },
            orderBy: {
                updatedAt: "desc",
            },
        });

        return NextResponse.json({ workflows });
    } catch (err: any) {
        if (err.message === "FORBIDDEN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
}


export async function POST(
    req: Request,
    context: { params: Promise<{ orgId: string }> }
) {
    try {
        // ✅ THIS IS REQUIRED in Next.js 14
        const { orgId } = await context.params;

        const user = await requireUser();
        await requireOrgMember(user.id, orgId);

        const { name } = await req.json();

        if (!name || !name.trim()) {
            return NextResponse.json(
                { error: "Workflow name required" },
                { status: 400 }
            );
        }

        const workflow = await prisma.workflow.create({
            data: {
                name,
                organizationId: orgId,
                createdById: user.id,
                versions: {
                    create: {
                        version: 1,
                        definition: {
                            nodes: [],
                            edges: [],
                        },
                    },
                },
            },
        });

        return NextResponse.json({ workflowId: workflow.id });
    } catch (err: any) {
        if (err.message === "FORBIDDEN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        if (err.message === "UNAUTHORIZED") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        return NextResponse.json(
            { error: "Failed to create workflow" },
            { status: 500 }
        );
    }
}
