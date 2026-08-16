import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/reports/[id] — vyřízení nahlášení (admin): resolved | dismissed
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
  const body = (await request.json().catch(() => null)) as {
    status?: unknown;
  } | null;
  const status = body?.status;
  if (status !== "resolved" && status !== "dismissed" && status !== "open") {
    return NextResponse.json({ error: "Neplatný stav." }, { status: 400 });
  }

  await prisma.report.update({
    where: { id },
    data: {
      status,
      resolvedAt: status === "open" ? null : new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
