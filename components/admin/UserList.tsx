"use client";

import { useState } from "react";
import type { Role } from "@/generated/prisma/client";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  pointCount: number;
  createdAt: string;
}

export function UserList({
  users,
  currentUserId,
}: {
  users: AdminUser[];
  currentUserId: string;
}) {
  const [rows, setRows] = useState<AdminUser[]>(users);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function changeRole(user: AdminUser, role: Role) {
    setBusyId(user.id);
    setError(null);
    try {
      const res = await fetch(`/api/users/${user.id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(data?.error ?? "Změna role se nepovedla.");
        return;
      }
      setRows((prev) =>
        prev.map((r) => (r.id === user.id ? { ...r, role } : r)),
      );
    } catch {
      setError("Chyba připojení.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-kraj-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-kraj-panel text-kraj-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Jméno</th>
              <th className="px-3 py-2 font-medium">E-mail</th>
              <th className="px-3 py-2 font-medium">Role</th>
              <th className="px-3 py-2 font-medium">Body</th>
              <th className="px-3 py-2 font-medium">Od</th>
              <th className="px-3 py-2 font-medium">Akce</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => {
              const isSelf = u.id === currentUserId;
              const isAdmin = u.role === "admin";
              return (
                <tr
                  key={u.id}
                  className="border-t border-kraj-border align-middle"
                >
                  <td className="px-3 py-2">
                    {u.name}
                    {isSelf && (
                      <span className="ml-1.5 text-xs text-kraj-muted">
                        (ty)
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-kraj-muted">{u.email}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded px-1.5 py-0.5 text-xs ${
                        isAdmin
                          ? "bg-kraj-gold/15 text-kraj-gold"
                          : "bg-kraj-border/40 text-kraj-muted"
                      }`}
                    >
                      {isAdmin ? "admin" : "user"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-kraj-muted">{u.pointCount}</td>
                  <td className="px-3 py-2 text-kraj-muted">{u.createdAt}</td>
                  <td className="px-3 py-2">
                    {isSelf ? (
                      <span className="text-xs text-kraj-muted">—</span>
                    ) : isAdmin ? (
                      <button
                        type="button"
                        disabled={busyId === u.id}
                        onClick={() => changeRole(u, "user")}
                        className="rounded-md border border-kraj-border px-2.5 py-1 text-xs text-kraj-muted hover:text-kraj-fg disabled:opacity-60"
                      >
                        Odebrat admina
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={busyId === u.id}
                        onClick={() => changeRole(u, "admin")}
                        className="rounded-md bg-kraj-gold/20 px-2.5 py-1 text-xs text-kraj-gold hover:bg-kraj-gold/30 disabled:opacity-60"
                      >
                        Povýšit na admina
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
