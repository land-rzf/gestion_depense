import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import { z } from "zod";
import { findUserByEmail } from "@/lib/auth";
import { getRedis, redisKeys } from "@/lib/redis";
import { registerSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const input = registerSchema.parse(await request.json());
    if (await findUserByEmail(input.email)) return NextResponse.json({ error: "Un compte utilise déjà cette adresse e-mail." }, { status: 409 });
    const redis = getRedis();
    const userId = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(input.password, 12);
    const createdAt = new Date().toISOString();
    await redis.hset(redisKeys.user(userId), { email: input.email, passwordHash, name: input.email.split("@")[0], createdAt });
    await redis.set(redisKeys.userEmail(input.email), userId);
    return NextResponse.json({ id: userId, email: input.email }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0]?.message ?? "Données d’inscription invalides." }, { status: 400 });
    console.error("[register]", error);
    return NextResponse.json({ error: "Impossible de créer le compte pour le moment." }, { status: 500 });
  }
}
