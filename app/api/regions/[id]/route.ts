import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateRegionSchema } from "@/lib/validation";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) return { error: "Nepřihlášen", status: 401 as const };
  if (session.user.role !== "admin")
    return { error: "Jen pro admina", status: 403 as const };
  return { session };
}

// PATCH /api/regions/[id] — úprava oblasti (admin)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireAdmin();
  if ("error" in ctx)
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const { id } = await params;
  const region = await prisma.region.findUnique({ where: { id } });
  if (!region)
    return NextResponse.json({ error: "Oblast nenalezena" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Neplatný JSON" }, { status: 400 });
  }

  const parsed = updateRegionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Neplatná data." },
      { status: 400 },
    );
  }
  const d = parsed.data;

  // Kontrola unikátnosti slugu při změně.
  if (d.slug && d.slug !== region.slug) {
    const clash = await prisma.region.findUnique({ where: { slug: d.slug } });
    if (clash) {
      return NextResponse.json(
        { error: "Oblast s tímto slugem už existuje." },
        { status: 400 },
      );
    }
  }

  await prisma.region.update({
    where: { id },
    data: {
      name: d.name,
      slug: d.slug,
      description: d.description,
      centerLat: d.centerLat,
      centerLng: d.centerLng,
      defaultZoom: d.defaultZoom,
      color: d.color,
      isPublished: d.isPublished,
    },
  });

  return NextResponse.json({ ok: true });
}

// DELETE /api/regions/[id] — smazání oblasti (admin). Body v oblasti zůstanou
// (jejich regionId se nastaví na NULL — viz onDelete: SetNull).
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireAdmin();
  if ("error" in ctx)
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const { id } = await params;
  const region = await prisma.region.findUnique({ where: { id } });
  if (!region)
    return NextResponse.json({ error: "Oblast nenalezena" }, { status: 404 });

  await prisma.region.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
