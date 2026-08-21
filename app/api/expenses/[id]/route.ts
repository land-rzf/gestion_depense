import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { deleteExpense, updateExpense } from "@/lib/expenses";
import { expenseUpdateSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";
async function getUserId() { const session = await getServerSession(authOptions); return session?.user?.id ?? null; }

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  try {
    const expense = await updateExpense(userId, params.id, expenseUpdateSchema.parse(await request.json()));
    if (!expense) return NextResponse.json({ error: "Dépense introuvable." }, { status: 404 });
    return NextResponse.json({ expense });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    console.error("[expenses:put]", error);
    return NextResponse.json({ error: "Impossible de modifier la dépense." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  try {
    if (!(await deleteExpense(userId, params.id))) return NextResponse.json({ error: "Dépense introuvable." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[expenses:delete]", error);
    return NextResponse.json({ error: "Impossible de supprimer la dépense." }, { status: 500 });
  }
}
