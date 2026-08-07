import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/users/[id]/role — změna role uživatele (jen admin).
export async function PATCH(
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

  // Pojistka proti odebrání práv sám sobě (aby se admin nezamkl ven).
  if (id === session.user.id) {
    return NextResponse.json(
      { error: "Vlastní roli takto měnit nelze." },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Neplatný JSON" }, { status: 400 });
  }

  const role = (body as { role?: unknown }).role;
  if (role !== "admin" && role !== "user") {
    return NextResponse.json({ error: "Neplatná role." }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ error: "Uživatel nenalezen" }, { status: 404 });
  }

  await prisma.user.update({ where: { id }, data: { role } });
  return NextResponse.json({ ok: true });
}
