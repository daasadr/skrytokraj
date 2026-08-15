import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getVisiblePoints } from "@/lib/points";
import { MAP_POINT_TYPES } from "@/lib/mapPoints";
import { createPointSchema } from "@/lib/validation";
import { sendPrivateShareInvite } from "@/lib/email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// GET /api/points — body viditelné pro přihlášeného uživatele
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
  }
  const points = await getVisiblePoints(session.user.id, session.user.email);
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
  // (schránka, poklad) — u ostatních je vždy veřejná. Příjemce lze zadat buď
  // jako existujícího uživatele (recipientId), nebo e-mailem (recipientEmail) —
  // pokud e-mail patří účtu, přiřadíme rovnou; jinak pošleme pozvánku.
  let visibility: "public" | "private_user" = "public";
  let recipientId: string | null = null;
  let recipientEmail: string | null = null;
  let inviteEmailTo: string | null = null;

  if (
    MAP_POINT_TYPES[data.type].shareable &&
    data.visibility === "private_user"
  ) {
    if (data.recipientId) {
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
    } else if (data.recipientEmail) {
      const email = data.recipientEmail.trim().toLowerCase();
      if (!EMAIL_RE.test(email)) {
        return NextResponse.json(
          { error: "Zadej platný e-mail příjemce." },
          { status: 400 },
        );
      }
      visibility = "private_user";
      const existing = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });
      if (existing) {
        recipientId = existing.id; // už má účet — přiřadíme rovnou
      } else {
        recipientEmail = email; // pozvánka; uvidí po registraci
        inviteEmailTo = email;
      }
    } else {
      return NextResponse.json(
        { error: "Vyber příjemce, nebo zadej e-mail pro pozvánku." },
        { status: 400 },
      );
    }
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
      recipientEmail,
      arContent: data.type === "ar_location" ? (data.arContent ?? null) : null,
      regionId,
      createdById: session.user.id,
    },
    select: { id: true },
  });

  // Pozvánka e-mailem (jen pokud je Resend nastaven) — neblokuje odpověď.
  if (inviteEmailTo) {
    void sendPrivateShareInvite({
      to: inviteEmailTo,
      inviterName: session.user.name ?? "Někdo",
      pointName: name,
      typeLabel: MAP_POINT_TYPES[data.type].label,
    });
  }

  return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
}
