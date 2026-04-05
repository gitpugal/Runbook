import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
                params: {
                    scope: "openid email profile",
                },
            },
        }),
    ],

    session: { strategy: "jwt" },

    callbacks: {
        async jwt({ token, account, profile }) {
            // Runs on sign-in
            if (account && profile) {
                token.email = profile.email;
                token.name = profile.name;
                token.sub = profile.sub; // Google user ID
                if (account.id_token) {
                    token.idToken = account.id_token;
                }
            }

            return token;
        },

        async session({ session, token }: any) {
            session.user.email = token.email as string;
            session.user.name = token.name as string;
            session.user.id = token.sub as string;

            session.idToken = token.idToken;

            return session;
        },

        async signIn({ profile }: any) {
            if (!profile?.email || !profile.sub) return false;

            try {
                await fetch(`${process.env.NEXT_PUBLIC_SPRING_API_ENDPOINT}/users`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email: profile.email,
                        name: profile.name,
                        provider: "google",
                        providerId: profile.sub,
                        image: profile.picture,
                    }),
                });
            } catch (error) {
                console.error("Error in signIn callback:", error);
            }

            return true;
        },
    },
});

export { handler as GET, handler as POST };
