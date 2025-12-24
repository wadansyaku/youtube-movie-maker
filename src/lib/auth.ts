import { PrismaAdapter } from "@auth/prisma-adapter";
import { type NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import { sendVerificationRequest } from "@/lib/email";

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],
    providers: [
        // Email Magic Link (production)
        EmailProvider({
            server: {
                host: process.env.EMAIL_SERVER_HOST || "",
                port: Number(process.env.EMAIL_SERVER_PORT) || 587,
                auth: {
                    user: process.env.EMAIL_SERVER_USER || "",
                    pass: process.env.EMAIL_SERVER_PASSWORD || "",
                },
            },
            from: process.env.EMAIL_FROM || "noreply@example.com",
            sendVerificationRequest: async ({ identifier, url, provider }) => {
                await sendVerificationRequest({ identifier, url, provider });
            },
        }),
        // Google OAuth (optional)
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
        // Credentials provider for development only
        ...(process.env.NODE_ENV === "development"
            ? [
                CredentialsProvider({
                    name: "Development",
                    credentials: {
                        email: { label: "Email", type: "email" },
                    },
                    async authorize(credentials) {
                        if (!credentials?.email) {
                            return null;
                        }
                        let user = await prisma.user.findUnique({
                            where: { email: credentials.email },
                        });
                        if (!user) {
                            user = await prisma.user.create({
                                data: {
                                    email: credentials.email,
                                    name: credentials.email.split("@")[0],
                                    role: "admin",
                                },
                            });
                        }
                        return {
                            id: user.id,
                            email: user.email,
                            name: user.name,
                            role: user.role,
                        };
                    },
                }),
            ]
            : []),
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = (user as { role?: string }).role || "viewer";
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as { id?: string }).id = token.id as string;
                (session.user as { role?: string }).role = token.role as string;
            }
            return session;
        },
    },
    pages: {
        signIn: "/auth/signin",
        verifyRequest: "/auth/verify-request",
        error: "/auth/error",
    },
};
