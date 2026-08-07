import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UserList, type AdminUser } from "@/components/admin/UserList";

export const metadata: Metadata = { title: "Uživatelé · Správa" };

export default async function AdminUsersPage() {
  const session = await auth();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { createdPoints: true } },
    },
  });

  const data: AdminUser[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    pointCount: u._count.createdPoints,
    createdAt: u.createdAt.toLocaleDateString("cs-CZ"),
  }));

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-kraj-muted">
        Povyš uživatele na <strong>admina</strong>, aby mohl na mapě zakládat
        úkoly, poklady a příběhová místa. Svoji vlastní roli měnit nelze.
      </p>
      <UserList users={data} currentUserId={session!.user.id} />
    </div>
  );
}
