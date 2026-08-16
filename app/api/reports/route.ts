import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendReportNotification } from "@/lib/email";
import { reportCategoryLabel } from "@/lib/reports";

const schema = z.object({
  pointId: z.string().min(1),
  category: z.enum([
    "vulgarity",
    "violence",
    "prank",
    "bad_intent",
    "other",
  ]),
  message: z.string().trim().min(1).max(3000),
});

// POST /api/reports — nahlášení objektu (přihlášený uživatel)
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

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Vyplň prosím důvod i popis." },
      { status: 400 },
    );
  }
  const data = parsed.data;

  const point = await prisma.mapPoint.findUnique({
    where: { id: data.pointId },
    select: { id: true, name: true },
  });
  if (!point) {
    return NextResponse.json({ error: "Objekt nenalezen" }, { status: 404 });
  }

  await prisma.report.create({
    data: {
      pointId: point.id,
      reporterId: session.user.id,
      category: data.category,
      message: data.message,
    },
  });

  // Upozornění adminovi e-mailem (jen pokud je Resend nastaven) — neblokuje.
  void sendReportNotification({
    pointName: point.name,
    category: reportCategoryLabel(data.category),
    message: data.message,
    reporterName: session.user.name ?? "Neznámý",
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
