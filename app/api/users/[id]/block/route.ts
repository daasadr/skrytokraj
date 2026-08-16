import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// POST /api/users/[id]/block — zablokovat/odblokovat uživatele (admin).
// Body: { blocked: boolean }. Zablokovaný se nepřihlásí.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Jen pro admina" }, { status: 403 });
  }

  const { id } = await params;
  if (id === session.user.id) {
    return NextResponse.json(
      { error: "Sám sebe zablokovat nelze." },
      { status: 400 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    blocked?: unknown;
  } | null;
  const blocked = body?.blocked === true;

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ error: "Uživatel nenalezen" }, { status: 404 });
  }

  await prisma.user.update({ where: { id }, data: { isBlocked: blocked } });
  return NextResponse.json({ ok: true });
}
