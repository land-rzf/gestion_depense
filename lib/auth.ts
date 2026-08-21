import bcrypt from "bcrypt";
import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";
import { getRedis, redisKeys } from "@/lib/redis";
import { emailSchema, passwordSchema } from "@/lib/validations";

type StoredUser = { email?: string; passwordHash?: string; name?: string };

export async function findUserByEmail(email: string) {
  const normalizedEmail = emailSchema.parse(email);
  const redis = getRedis();
  const userId = await redis.get<string>(redisKeys.userEmail(normalizedEmail));
  if (!userId) return null;
  const data = (await redis.hgetall(redisKeys.user(userId))) as StoredUser | null;
  if (!data?.email || !data.passwordHash) return null;
  return { id: userId, email: data.email, name: data.name ?? data.email.split("@")[0], passwordHash: data.passwordHash };
}

export const authOptions: NextAuthOptions = {
  secret: "Ceci est mon test secret 12345678@...........@1234567532468765Z3",
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [CredentialsProvider({
    name: "Email et mot de passe",
    credentials: { email: { label: "E-mail", type: "email" }, password: { label: "Mot de passe", type: "password" } },
    async authorize(credentials) {
      try {
        const email = emailSchema.parse(credentials?.email);
        const password = passwordSchema.parse(credentials?.password);
        const user = await findUserByEmail(email);
        if (!user || !(await bcrypt.compare(password, user.passwordHash))) return null;
        return { id: user.id, email: user.email, name: user.name };
      } catch { return null; }
    }
  })],
  callbacks: {
    jwt({ token, user }) { if (user) token.id = user.id; return token; },
    session({ session, token }) { if (session.user && token.id) session.user.id = token.id; return session; }
  }
};
