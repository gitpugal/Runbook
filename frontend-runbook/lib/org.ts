import prisma from "@/lib/prisma";

/**
 * Ensures the user is a member of the organization
 * Returns the membership (role included)
 */
export async function requireOrgMember(
    userId: string,
    orgId: string
) {
    if (!orgId) {
        throw new Error("ORG_ID_REQUIRED");
    }

    const membership = await prisma.organizationMember.findUnique({
        where: {
            userId_organizationId: {
                userId,
                organizationId: orgId,
            },
        },
    });

    if (!membership) {
        throw new Error("FORBIDDEN");
    }

    return membership;
}
