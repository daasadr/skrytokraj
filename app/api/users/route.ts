import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserOptions } from "@/lib/points";

// GET /api/users — seznam uživatelů (id + jméno) pro výběr příjemce
// soukromé schránky. Jen pro přihlášené; e-maily se nevrací.
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
  }
  const users = await getUserOptions();
  return NextResponse.json({ users });
}
