import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updatePointSchema } from "@/lib/validation";
import { MAP_POINT_TYPES, type MapPointTypeKey } from "@/lib/mapPoints";
import { sendPrivateShareInvite } from "@/lib/email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Oprávnění: admin smí upravovat/mazat libovolný bod; běžný autor smí
// upravovat/mazat jen vlastní schránku se vzkazem (message_box).
async function loadWithPermission(id: string) {
  const session = await auth();
  if (!session?.user) return { error: "Nepřihlášen" as const, status: 401 };

  const point = await prisma.mapPoint.findUnique({ where: { id } });
  if (!point) return { error: "Bod nenalezen" as const, status: 404 };

  const isAdmin = session.user.role === "admin";
  const isOwnMessageBox =
    point.createdById === session.user.id && point.type === "message_box";

  if (!isAdmin && !isOwnMessageBox) {
    return { error: "Nemáš oprávnění" as const, status: 403 };
  }
  return { session, point, isAdmin };
}

// PATCH /api/points/[id] — úprava bodu
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ctx = await loadWithPermission(id);
  if ("error" in ctx) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Neplatný JSON" }, { status: 400 });
  }

  const parsed = updatePointSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Neplatná data." }, { status: 400 });
  }
  const data = parsed.data;

  // Příjemce (existující uživatel nebo e-mailová pozvánka), pokud je bod soukromý.
  let recipientId = ctx.point.recipientId;
  let recipientEmail = ctx.point.recipientEmail;
  let inviteEmailTo: string | null = null;

  if (data.visibility === "private_user") {
    if (data.recipientId) {
      const exists = await prisma.user.findUnique({
        where: { id: data.recipientId },
        select: { id: true },
      });
      if (!exists) {
        return NextResponse.json(
          { error: "Vybraný příjemce neexistuje." },
          { status: 400 },
        );
      }
      recipientId = data.recipientId;
      recipientEmail = null;
    } else if (data.recipientEmail) {
      const email = data.recipientEmail.trim().toLowerCase();
      if (!EMAIL_RE.test(email)) {
        return NextResponse.json(
          { error: "Zadej platný e-mail příjemce." },
          { status: 400 },
        );
      }
      const existing = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });
      if (existing) {
        recipientId = existing.id;
        recipientEmail = null;
      } else {
        recipientEmail = email;
        recipientId = null;
        inviteEmailTo = email;
      }
    } else if (!recipientId && !recipientEmail) {
      return NextResponse.json(
        { error: "Vyber příjemce, nebo zadej e-mail pro pozvánku." },
        { status: 400 },
      );
    }
  } else if (data.visibility === "public") {
    recipientId = null;
    recipientEmail = null;
  }

  // Zařazení do oblasti — měníme jen když je regionId v těle (undefined = beze změny,
  // null/"" = vyřadit z oblasti).
  const regionUpdate: { regionId?: string | null } = {};
  if (data.regionId !== undefined) {
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
      regionUpdate.regionId = region.id;
    } else {
      regionUpdate.regionId = null;
    }
  }

  await prisma.mapPoint.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      hint: data.hint,
      answer:
        data.answer === undefined
          ? undefined
          : data.answer?.trim()
            ? data.answer.trim()
            : null,
      imageUrls: data.imageUrls,
      lat: data.lat,
      lng: data.lng,
      visibility: data.visibility,
      recipientId,
      recipientEmail,
      arContent: data.arContent,
      isActive: data.isActive,
      ...regionUpdate,
    },
  });

  // Pozvánka e-mailem (jen pokud je Resend nastaven) — neblokuje odpověď.
  if (inviteEmailTo) {
    void sendPrivateShareInvite({
      to: inviteEmailTo,
      inviterName: ctx.session.user.name ?? "Někdo",
      pointName: data.name ?? ctx.point.name,
      typeLabel: MAP_POINT_TYPES[ctx.point.type as MapPointTypeKey].label,
    });
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/points/[id] — smazání bodu
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ctx = await loadWithPermission(id);
  if ("error" in ctx) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }

  await prisma.mapPoint.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
