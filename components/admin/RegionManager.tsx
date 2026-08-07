"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { RegionDTO } from "@/lib/regions";
import { DEFAULT_MAP_CENTER } from "@/lib/mapPoints";

// Mini-mapa pro výběr středu — bez SSR (MapLibre potřebuje window).
const RegionCenterPicker = dynamic(
  () => import("./RegionCenterPicker").then((m) => m.RegionCenterPicker),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 items-center justify-center rounded-lg border border-kraj-border text-kraj-muted">
        Načítám mapu…
      </div>
    ),
  },
);

interface FormValues {
  name: string;
  slug: string;
  description: string;
  centerLat: string;
  centerLng: string;
  defaultZoom: string;
  color: string;
  isPublished: boolean;
}

const emptyForm: FormValues = {
  name: "",
  slug: "",
  description: "",
  centerLat: String(DEFAULT_MAP_CENTER.latitude),
  centerLng: String(DEFAULT_MAP_CENTER.longitude),
  defaultZoom: "13",
  color: "",
  isPublished: false,
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // odstranit diakritiku
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function RegionManager({
  initial,
  mapStyleUrl,
}: {
  initial: RegionDTO[];
  mapStyleUrl: string;
}) {
  const [regions, setRegions] = useState<RegionDTO[]>(initial);
  const [editingId, setEditingId] = useState<string | null>(null); // null = zavřeno, "new" = nová
  const [form, setForm] = useState<FormValues>(emptyForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refetch() {
    const res = await fetch("/api/regions");
    if (res.ok) setRegions((await res.json()).regions);
  }

  function openNew() {
    setForm(emptyForm);
    setEditingId("new");
    setError(null);
  }

  function openEdit(r: RegionDTO) {
    setForm({
      name: r.name,
      slug: r.slug,
      description: r.description ?? "",
      centerLat: String(r.centerLat),
      centerLng: String(r.centerLng),
      defaultZoom: String(r.defaultZoom),
      color: r.color ?? "",
      isPublished: r.isPublished,
    });
    setEditingId(r.id);
    setError(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim() || null,
      centerLat: Number(form.centerLat),
      centerLng: Number(form.centerLng),
      defaultZoom: Number(form.defaultZoom),
      color: form.color.trim() || null,
      isPublished: form.isPublished,
    };

    try {
      const res =
        editingId === "new"
          ? await fetch("/api/regions", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            })
          : await fetch(`/api/regions/${editingId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(data?.error ?? "Uložení se nepovedlo.");
        return;
      }
      await refetch();
      setEditingId(null);
    } catch {
      setError("Chyba připojení.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(r: RegionDTO) {
    if (
      !window.confirm(
        `Smazat oblast „${r.name}"? Body v ní zůstanou, jen ztratí zařazení.`,
      )
    )
      return;
    const res = await fetch(`/api/regions/${r.id}`, { method: "DELETE" });
    if (res.ok) await refetch();
    else window.alert("Smazání se nepovedlo.");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-kraj-muted">
          Kraje Skrytokraje. Zakládej je průběžně, jak v nich začneš tvořit.
        </p>
        {editingId === null && (
          <button
            type="button"
            onClick={openNew}
            className="rounded-lg bg-kraj-accent px-3 py-2 text-sm font-medium text-kraj-bg hover:opacity-90"
          >
            ＋ Nová oblast
          </button>
        )}
      </div>

      {editingId !== null && (
        <form
          onSubmit={save}
          className="flex flex-col gap-3 rounded-xl border border-kraj-border bg-kraj-bg2 p-4"
        >
          <h2 className="font-semibold">
            {editingId === "new" ? "Nová oblast" : "Upravit oblast"}
          </h2>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Název">
              <input
                required
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((f) => ({
                    ...f,
                    name,
                    // slug dogenerujeme jen u nové oblasti a dokud ho neměníš ručně
                    slug:
                      editingId === "new" && (f.slug === "" || f.slug === slugify(f.name))
                        ? slugify(name)
                        : f.slug,
                  }));
                }}
                className="w-full rounded-lg border border-kraj-border bg-kraj-bg px-3 py-2 outline-none focus:border-kraj-accent"
              />
            </Field>
            <Field label="Slug (do adresy)">
              <input
                required
                value={form.slug}
                onChange={(e) =>
                  setForm((f) => ({ ...f, slug: slugify(e.target.value) }))
                }
                className="w-full rounded-lg border border-kraj-border bg-kraj-bg px-3 py-2 outline-none focus:border-kraj-accent"
              />
            </Field>
          </div>

          <Field label="Úvod příběhu oblasti">
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              className="w-full resize-y rounded-lg border border-kraj-border bg-kraj-bg px-3 py-2 outline-none focus:border-kraj-accent"
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Střed — šířka (lat)">
              <input
                required
                type="number"
                step="any"
                value={form.centerLat}
                onChange={(e) =>
                  setForm((f) => ({ ...f, centerLat: e.target.value }))
                }
                className="w-full rounded-lg border border-kraj-border bg-kraj-bg px-3 py-2 outline-none focus:border-kraj-accent"
              />
            </Field>
            <Field label="Střed — délka (lng)">
              <input
                required
                type="number"
                step="any"
                value={form.centerLng}
                onChange={(e) =>
                  setForm((f) => ({ ...f, centerLng: e.target.value }))
                }
                className="w-full rounded-lg border border-kraj-border bg-kraj-bg px-3 py-2 outline-none focus:border-kraj-accent"
              />
            </Field>
            <Field label="Přiblížení (1–20)">
              <input
                required
                type="number"
                step="any"
                min={1}
                max={20}
                value={form.defaultZoom}
                onChange={(e) =>
                  setForm((f) => ({ ...f, defaultZoom: e.target.value }))
                }
                className="w-full rounded-lg border border-kraj-border bg-kraj-bg px-3 py-2 outline-none focus:border-kraj-accent"
              />
            </Field>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-sm text-kraj-muted">
              Střed na mapě — klepni nebo táhni značku; přiblížením nastavíš zoom
            </span>
            <RegionCenterPicker
              mapStyleUrl={mapStyleUrl}
              lat={Number(form.centerLat) || DEFAULT_MAP_CENTER.latitude}
              lng={Number(form.centerLng) || DEFAULT_MAP_CENTER.longitude}
              zoom={Number(form.defaultZoom) || 13}
              onChange={({ lat, lng, zoom }) =>
                setForm((f) => ({
                  ...f,
                  centerLat: lat.toFixed(6),
                  centerLng: lng.toFixed(6),
                  defaultZoom: String(Math.round(zoom * 10) / 10),
                }))
              }
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Barva oblasti (hex, nepovinné)">
              <input
                value={form.color}
                placeholder="#8fae8b"
                onChange={(e) =>
                  setForm((f) => ({ ...f, color: e.target.value }))
                }
                className="w-full rounded-lg border border-kraj-border bg-kraj-bg px-3 py-2 outline-none focus:border-kraj-accent"
              />
            </Field>
            <label className="flex items-center gap-2 self-end py-2 text-sm">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) =>
                  setForm((f) => ({ ...f, isPublished: e.target.checked }))
                }
              />
              Zveřejněno (viditelné hráčům)
            </label>
          </div>

          <p className="text-xs text-kraj-muted">
            Tip: souřadnice středu si najdeš na mapě — v další fázi přidáme
            výběr středu klepnutím do mapy.
          </p>

          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-kraj-accent px-4 py-2 font-medium text-kraj-bg hover:opacity-90 disabled:opacity-60"
            >
              {busy ? "Ukládám…" : "Uložit"}
            </button>
            <button
              type="button"
              onClick={() => setEditingId(null)}
              className="rounded-lg border border-kraj-border px-4 py-2 text-kraj-muted hover:text-kraj-fg"
            >
              Zrušit
            </button>
          </div>
        </form>
      )}

      {regions.length === 0 ? (
        <p className="rounded-xl border border-dashed border-kraj-border px-4 py-8 text-center text-kraj-muted">
          Zatím žádná oblast. Založ první kraj (třeba Petřvald).
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {regions.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-kraj-border bg-kraj-bg2 px-4 py-3"
            >
              {r.color && (
                <span
                  className="h-4 w-4 rounded-full border border-black/30"
                  style={{ backgroundColor: r.color }}
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{r.name}</span>
                  <span className="text-xs text-kraj-muted">/{r.slug}</span>
                  {r.isPublished ? (
                    <span className="rounded bg-kraj-accent/15 px-1.5 py-0.5 text-xs text-kraj-accent">
                      zveřejněno
                    </span>
                  ) : (
                    <span className="rounded bg-kraj-border/40 px-1.5 py-0.5 text-xs text-kraj-muted">
                      skryté
                    </span>
                  )}
                </div>
                <div className="text-xs text-kraj-muted">
                  {r.pointCount} bodů · střed {r.centerLat.toFixed(4)},{" "}
                  {r.centerLng.toFixed(4)}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(r)}
                  className="rounded-md border border-kraj-border px-2.5 py-1 text-xs hover:bg-kraj-panel"
                >
                  Upravit
                </button>
                <button
                  type="button"
                  onClick={() => remove(r)}
                  className="rounded-md border border-red-500/40 px-2.5 py-1 text-xs text-red-300 hover:bg-red-500/10"
                >
                  Smazat
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-kraj-muted">{label}</span>
      {children}
    </label>
  );
}
