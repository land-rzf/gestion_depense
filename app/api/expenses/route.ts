import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { createExpense, listExpenses } from "@/lib/expenses";
import { expenseFilterSchema, expenseInputSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";
async function getUserId() { const session = await getServerSession(authOptions); return session?.user?.id ?? null; }

export async function GET(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  try {
    const { searchParams } = new URL(request.url);
    const filters = expenseFilterSchema.parse({ month: searchParams.get("month") || undefined, category: searchParams.get("category") || undefined });
    return NextResponse.json({ expenses: await listExpenses(userId, filters) });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    console.error("[expenses:get]", error);
    return NextResponse.json({ error: "Impossible de charger les dépenses." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  try {
    const input = expenseInputSchema.parse(await request.json());
    return NextResponse.json({ expense: await createExpense(userId, input) }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    console.error("[expenses:post]", error);
    return NextResponse.json({ error: "Impossible d’ajouter la dépense." }, { status: 500 });
  }
}
