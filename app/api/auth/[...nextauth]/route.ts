import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

// Hash the password from env on server startup (do this once for comparison)
const getPasswordHash = async () => {
    const password = process.env.ADMIN_PASSWORD;
    if (!password) throw new Error("ADMIN_PASSWORD not configured");
    // We'll hash the env password and compare with input
    return await bcrypt.hash(password, 10);
};

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email", placeholder: "admin@example.com" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Email and password are required");
                }

                const adminEmail = process.env.ADMIN_EMAIL;
                const adminPassword = process.env.ADMIN_PASSWORD;

                if (!adminEmail || !adminPassword) {
                    throw new Error("Admin credentials not configured");
                }

                // Check email
                if (credentials.email.toLowerCase() !== adminEmail.toLowerCase()) {
                    throw new Error("Invalid credentials");
                }

                // Check password (direct comparison since both are from secure sources)
                // In production with multiple users, you'd hash stored passwords
                const isValidPassword = credentials.password === adminPassword;

                if (!isValidPassword) {
                    throw new Error("Invalid credentials");
                }

                // Return user object
                return {
                    id: "1",
                    email: adminEmail,
                    name: "TEDx Admin",
                    role: "admin"
                };
            }
        })
    ],
    session: {
        strategy: "jwt",
        maxAge: 24 * 60 * 60, // 24 hours
    },
    jwt: {
        maxAge: 24 * 60 * 60, // 24 hours
    },
    pages: {
        signIn: "/login",
        error: "/login",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as { role?: string }).role;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as { role?: string }).role = token.role as string;
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
