import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Porovnání odpovědi shovívavě: bez ohledu na velikost písmen, diakritiku a
// okrajové mezery.
function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

// POST /api/points/[id]/solve — hráč zadá odpověď na úkol
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
  }

  const { id } = await params;
  const point = await prisma.mapPoint.findUnique({ where: { id } });
  if (!point || !point.isActive) {
    return NextResponse.json({ error: "Bod nenalezen" }, { status: 404 });
  }
  if (!point.answer) {
    return NextResponse.json(
      { error: "Tento bod nemá odpověď k zadání." },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Neplatný JSON" }, { status: 400 });
  }
  const answer = String((body as { answer?: unknown }).answer ?? "");

  const correct = normalize(answer) === normalize(point.answer);
  if (!correct) {
    return NextResponse.json({ correct: false });
  }

  // Zaznamenat vyřešení (idempotentně).
  await prisma.pointCompletion.upsert({
    where: { userId_pointId: { userId: session.user.id, pointId: id } },
    create: { userId: session.user.id, pointId: id },
    update: {},
  });

  return NextResponse.json({ correct: true });
}
