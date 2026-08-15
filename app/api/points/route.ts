import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getVisiblePoints } from "@/lib/points";
import { MAP_POINT_TYPES } from "@/lib/mapPoints";
import { createPointSchema } from "@/lib/validation";

// GET /api/points — body viditelné pro přihlášeného uživatele
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
  }
  const points = await getVisiblePoints(session.user.id);
  return NextResponse.json({ points });
}

// POST /api/points — založení bodu
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Neplatný JSON" }, { status: 400 });
  }

  const parsed = createPointSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Neplatná data bodu." },
      { status: 400 },
    );
  }
  const data = parsed.data;
  const isAdmin = session.user.role === "admin";

  // Oprávnění podle typu: adminOnly typy smí zakládat jen admin.
  if (MAP_POINT_TYPES[data.type].adminOnly && !isAdmin) {
    return NextResponse.json(
      { error: "Tento typ bodu smí zakládat jen správce." },
      { status: 403 },
    );
  }

  // Viditelnost: soukromá (private_user) dává smysl u sdílitelných typů
  // (schránka, poklad) — u ostatních je vždy veřejná.
  let visibility: "public" | "private_user" = "public";
  let recipientId: string | null = null;

  if (
    MAP_POINT_TYPES[data.type].shareable &&
    data.visibility === "private_user"
  ) {
    if (!data.recipientId) {
      return NextResponse.json(
        { error: "Vyber příjemce soukromé schránky." },
        { status: 400 },
      );
    }
    const recipient = await prisma.user.findUnique({
      where: { id: data.recipientId },
      select: { id: true },
    });
    if (!recipient) {
      return NextResponse.json(
        { error: "Vybraný příjemce neexistuje." },
        { status: 400 },
      );
    }
    visibility = "private_user";
    recipientId = recipient.id;
  }

  // Zařazení do oblasti (nepovinné) — ověříme, že oblast existuje.
  let regionId: string | null = null;
  if (data.regionId) {
    const region = await prisma.region.findUnique({
      where: { id: data.regionId },
      select: { id: true },
    });
    if (!region) {
      return NextResponse.json(
        { error: "Vybraná oblast neexistuje." },
        { status: 400 },
      );
    }
    regionId = region.id;
  }

  // Název: u schránky nepovinný, doplníme rozumný default.
  const name =
    data.name && data.name.length > 0
      ? data.name
      : data.type === "message_box"
        ? "Schránka se vzkazem"
        : MAP_POINT_TYPES[data.type].label;

  const created = await prisma.mapPoint.create({
    data: {
      type: data.type,
      name,
      description: data.description ?? null,
      hint: data.hint ?? null,
      lat: data.lat,
      lng: data.lng,
      visibility,
      recipientId,
      arContent: data.type === "ar_location" ? (data.arContent ?? null) : null,
      regionId,
      createdById: session.user.id,
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
}
