import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";

const credentialsSchema = z.object({
  email: z.string().trim().min(1).max(254),
  password: z.string().min(1).max(200),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  pages: { signIn: "/admin/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Username or email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
        const passwordHash = process.env.ADMIN_PASSWORD_HASH;
        if (!parsed.success || !adminEmail || !passwordHash) return null;
        if (parsed.data.email.trim().toLowerCase() !== adminEmail) return null;
        if (!await compare(parsed.data.password, passwordHash)) return null;
        return { id: adminEmail, email: adminEmail, role: "admin" };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.role === "admin") token.role = "admin";
      return token;
    },
    session({ session, token }) {
      if (session.user && token.role === "admin") session.user.role = "admin";
      return session;
    },
  },
});
