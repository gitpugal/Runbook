import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";

/**
 * Ensures the request is authenticated and returns the DB user
 */
export async function requireUser() {
    const session = await getServerSession();

    if (!session?.user?.email) {
        throw new Error("UNAUTHORIZED");
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    });

    if (!user) {
        throw new Error("USER_NOT_FOUND");
    }

    return user;
}
