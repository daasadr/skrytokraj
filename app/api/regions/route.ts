import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getAllRegions } from "@/lib/regions";
import { createRegionSchema } from "@/lib/validation";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) return { error: "Nepřihlášen", status: 401 as const };
  if (session.user.role !== "admin")
    return { error: "Jen pro admina", status: 403 as const };
  return { session };
}

// GET /api/regions — všechny oblasti (admin)
export async function GET() {
  const ctx = await requireAdmin();
  if ("error" in ctx)
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  return NextResponse.json({ regions: await getAllRegions() });
}

// POST /api/regions — založení oblasti (admin)
export async function POST(request: Request) {
  const ctx = await requireAdmin();
  if ("error" in ctx)
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Neplatný JSON" }, { status: 400 });
  }

  const parsed = createRegionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Neplatná data oblasti." },
      { status: 400 },
    );
  }
  const d = parsed.data;

  const existing = await prisma.region.findUnique({ where: { slug: d.slug } });
  if (existing) {
    return NextResponse.json(
      { error: "Oblast s tímto slugem už existuje." },
      { status: 400 },
    );
  }

  const created = await prisma.region.create({
    data: {
      name: d.name,
      slug: d.slug,
      description: d.description ?? null,
      centerLat: d.centerLat,
      centerLng: d.centerLng,
      defaultZoom: d.defaultZoom ?? 13,
      color: d.color ?? null,
      isPublished: d.isPublished ?? false,
      createdById: ctx.session.user.id,
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
}
