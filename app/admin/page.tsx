import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Správa" };

export default async function AdminHomePage() {
  const [userCount, adminCount, pointCount, regionCount] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "admin" } }),
    prisma.mapPoint.count(),
    prisma.region.count(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Uživatelé" value={userCount} />
        <Stat label="Admini" value={adminCount} />
        <Stat label="Oblasti" value={regionCount} />
        <Stat label="Body na mapě" value={pointCount} />
      </div>

      <div className="flex flex-col gap-2">
        <Card
          href="/admin/oblasti"
          title="Oblasti (kraje)"
          desc="Zakládej kraje Skrytokraje průběžně — Petřvald, Průhonice a další."
        />
        <Card
          href="/admin/uzivatele"
          title="Uživatelé"
          desc="Přehled účtů a změna rolí — koho povýšit na admina."
        />
        <Card
          href="/mapa"
          title="Body na mapě"
          desc="Zakládání úkolů, pokladů, příběhových a AR míst (zatím přes mapu)."
        />
      </div>

      <p className="text-sm text-kraj-muted">
        Připravuje se: napojení bodů na oblast a správa obsahu přímo na webu.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-kraj-border bg-kraj-panel px-4 py-3">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-sm text-kraj-muted">{label}</div>
    </div>
  );
}

function Card({
  href,
  title,
  desc,
}: {
  href: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-kraj-border bg-kraj-bg2 px-4 py-3 transition-colors hover:bg-kraj-panel"
    >
      <div className="font-medium">{title}</div>
      <div className="text-sm text-kraj-muted">{desc}</div>
    </Link>
  );
}
