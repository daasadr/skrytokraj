"use client";

import { useState } from "react";
import Link from "next/link";
import { MAP_POINT_TYPES, type MapPointTypeKey } from "@/lib/mapPoints";
import { PhotoGallery } from "@/components/PhotoGallery";

export interface AdminReport {
  id: string;
  category: string;
  message: string;
  createdAt: string;
  reporterName: string;
  point: {
    id: string;
    name: string;
    type: string;
    description: string | null;
    longDescription: string | null;
    hint: string | null;
    imageUrls: string[];
    lat: number;
    lng: number;
    visibility: "public" | "private_user";
    authorId: string;
    authorName: string;
    authorEmail: string;
    authorBlocked: boolean;
  };
}

export function ReportsAdmin({ reports }: { reports: AdminReport[] }) {
  const [rows, setRows] = useState<AdminReport[]>(reports);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function setAuthorBlocked(authorId: string, blocked: boolean) {
    setRows((prev) =>
      prev.map((r) =>
        r.point.authorId === authorId
          ? { ...r, point: { ...r.point, authorBlocked: blocked } }
          : r,
      ),
    );
  }

  async function deletePoint(r: AdminReport) {
    if (
      !window.confirm(
        `Smazat objekt „${r.point.name}" z mapy? (V krajině odstraň schránku zvlášť.)`,
      )
    )
      return;
    setBusyId(r.id);
    setError(null);
    const res = await fetch(`/api/points/${r.point.id}`, { method: "DELETE" });
    setBusyId(null);
    if (res.ok) {
      // smazáním bodu se nahlášení odstraní (kaskáda)
      setRows((prev) => prev.filter((x) => x.point.id !== r.point.id));
    } else {
      setError("Smazání objektu se nepovedlo.");
    }
  }

  async function toggleBlock(r: AdminReport) {
    const blocked = !r.point.authorBlocked;
    if (
      blocked &&
      !window.confirm(`Zablokovat uživatele ${r.point.authorName}?`)
    )
      return;
    setBusyId(r.id);
    setError(null);
    const res = await fetch(`/api/users/${r.point.authorId}/block`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocked }),
    });
    setBusyId(null);
    if (res.ok) setAuthorBlocked(r.point.authorId, blocked);
    else setError("Změna blokace se nepovedla.");
  }

  async function dismiss(r: AdminReport) {
    setBusyId(r.id);
    setError(null);
    const res = await fetch(`/api/reports/${r.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "dismissed" }),
    });
    setBusyId(null);
    if (res.ok) setRows((prev) => prev.filter((x) => x.id !== r.id));
    else setError("Akce se nepovedla.");
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {rows.map((r) => {
        const meta = MAP_POINT_TYPES[r.point.type as MapPointTypeKey];
        return (
          <div
            key={r.id}
            className="flex flex-col gap-2 rounded-xl border border-kraj-border bg-kraj-bg2 p-4"
          >
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span
                className="rounded-full px-2 py-0.5 text-xs text-black"
                style={{ backgroundColor: meta?.color ?? "#999" }}
              >
                {meta?.emoji} {meta?.label}
              </span>
              {r.point.visibility === "private_user" && (
                <span className="rounded bg-kraj-gold/15 px-1.5 py-0.5 text-xs text-kraj-gold">
                  soukromé
                </span>
              )}
              <span className="font-medium">{r.point.name}</span>
              <span className="ml-auto text-xs text-kraj-muted">
                {r.createdAt}
              </span>
            </div>

            <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm">
              <span className="text-red-300">Důvod: {r.category}</span>
              <p className="mt-1 whitespace-pre-wrap text-kraj-fg">
                {r.message}
              </p>
              <p className="mt-1 text-xs text-kraj-muted">
                Nahlásil(a): {r.reporterName}
              </p>
            </div>

            {/* Obsah objektu (zpřístupněný nahlášením) */}
            <div className="rounded-lg border border-kraj-border px-3 py-2 text-sm">
              {r.point.description && (
                <p className="whitespace-pre-wrap text-kraj-muted">
                  {r.point.description}
                </p>
              )}
              {r.point.longDescription && (
                <p className="mt-1 whitespace-pre-wrap text-kraj-muted">
                  {r.point.longDescription}
                </p>
              )}
              {r.point.hint && (
                <p className="mt-1 text-kraj-muted">Nápověda: {r.point.hint}</p>
              )}
              {r.point.imageUrls.length > 0 && (
                <div className="mt-2">
                  <PhotoGallery urls={r.point.imageUrls} />
                </div>
              )}
              <p className="mt-2 text-xs text-kraj-muted">
                Autor: {r.point.authorName} ({r.point.authorEmail})
                {r.point.authorBlocked && (
                  <span className="ml-1 text-red-300">— zablokován</span>
                )}{" "}
                · {r.point.lat.toFixed(5)}, {r.point.lng.toFixed(5)}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busyId === r.id}
                onClick={() => deletePoint(r)}
                className="rounded-md border border-red-500/40 px-3 py-1.5 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-60"
              >
                Smazat objekt
              </button>
              <button
                type="button"
                disabled={busyId === r.id}
                onClick={() => toggleBlock(r)}
                className="rounded-md border border-kraj-border px-3 py-1.5 text-sm hover:bg-kraj-panel disabled:opacity-60"
              >
                {r.point.authorBlocked ? "Odblokovat autora" : "Zablokovat autora"}
              </button>
              <button
                type="button"
                disabled={busyId === r.id}
                onClick={() => dismiss(r)}
                className="rounded-md border border-kraj-border px-3 py-1.5 text-sm text-kraj-muted hover:text-kraj-fg disabled:opacity-60"
              >
                V pořádku (zamítnout)
              </button>
              <Link
                href={`/bod/${r.point.id}`}
                className="rounded-md px-3 py-1.5 text-sm text-kraj-accent hover:underline"
              >
                Otevřít detail →
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
