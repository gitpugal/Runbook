import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";


export async function GET() {
    const session = await getServerSession();
    if (!session?.user?.email) return new Response("Unauthorized", { status: 401 });

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { memberships: true },
    });

    return Response.json(user?.memberships ?? []);
}
