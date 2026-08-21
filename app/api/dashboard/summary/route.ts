import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getDashboardSummary } from "@/lib/expenses";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  try { return NextResponse.json(await getDashboardSummary(session.user.id)); }
  catch (error) {
    console.error("[dashboard:summary]", error);
    return NextResponse.json({ error: "Impossible de charger le tableau de bord." }, { status: 500 });
  }
}

