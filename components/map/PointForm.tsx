"use client";

import { useState } from "react";
import type { MapPointTypeKey, RegionOption } from "@/lib/mapPoints";
import { MAP_POINT_TYPES } from "@/lib/mapPoints";
import type { UserOption } from "@/lib/points";
import { compressImage } from "@/lib/imageCompress";

const MAX_PHOTOS = 8;

export interface PointFormValues {
  name: string;
  description: string;
  hint: string;
  imageUrls: string[];
  visibility: "public" | "private_user";
  recipientId: string | null;
  recipientEmail: string | null;
  arContent: string;
  regionId: string | null;
}

interface PointFormProps {
  type: MapPointTypeKey;
  mode: "create" | "edit";
  coords: { lat: number; lng: number };
  users: UserOption[];
  regions: RegionOption[];
  currentUserId: string;
  initial?: Partial<PointFormValues>;
  busy: boolean;
  error: string | null;
  onSave: (values: PointFormValues) => void;
  onCancel: () => void;
}

export function PointForm({
  type,
  mode,
  coords,
  users,
  regions,
  currentUserId,
  initial,
  busy,
  error,
  onSave,
  onCancel,
}: PointFormProps) {
  const meta = MAP_POINT_TYPES[type];
  const isMessageBox = type === "message_box";
  const isAr = type === "ar_location";
  const shareable = meta.shareable; // schránka i poklad
  const showHint = !isMessageBox; // nápověda k nalezení (ne u vzkazu)

  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [hint, setHint] = useState(initial?.hint ?? "");
  const [visibility, setVisibility] = useState<"public" | "private_user">(
    initial?.visibility ?? "public",
  );
  const [recipientId, setRecipientId] = useState<string>(
    initial?.recipientId ?? "",
  );
  const [recipientEmail, setRecipientEmail] = useState<string>(
    initial?.recipientEmail ?? "",
  );
  // Režim příjemce: existující uživatel, nebo pozvánka e-mailem.
  const [recipientMode, setRecipientMode] = useState<"user" | "email">(
    initial?.recipientEmail ? "email" : "user",
  );
  const [arContent, setArContent] = useState(initial?.arContent ?? "");
  const [regionId, setRegionId] = useState<string>(initial?.regionId ?? "");
  const [images, setImages] = useState<string[]>(initial?.imageUrls ?? []);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploadError(null);
    setUploading(true);
    try {
      const room = MAX_PHOTOS - images.length;
      const picked = Array.from(files).slice(0, Math.max(0, room));
      for (const file of picked) {
        if (!file.type.startsWith("image/")) continue;
        const blob = await compressImage(file);
        const fd = new FormData();
        fd.append("file", blob, "photo.jpg");
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (!res.ok) {
          const d = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          setUploadError(d?.error ?? "Nahrání fotky se nepovedlo.");
          continue;
        }
        const { url } = (await res.json()) as { url: string };
        setImages((prev) => [...prev, url]);
      }
    } catch {
      setUploadError("Zpracování fotky selhalo.");
    } finally {
      setUploading(false);
    }
  }

  function removeImage(url: string) {
    setImages((prev) => prev.filter((u) => u !== url));
  }

  const recipients = users.filter((u) => u.id !== currentUserId);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      name: name.trim(),
      description: description.trim(),
      hint: showHint ? hint.trim() : "",
      imageUrls: images,
      visibility: shareable ? visibility : "public",
      recipientId:
        shareable && visibility === "private_user" && recipientMode === "user"
          ? recipientId || null
          : null,
      recipientEmail:
        shareable && visibility === "private_user" && recipientMode === "email"
          ? recipientEmail.trim() || null
          : null,
      arContent: isAr ? arContent.trim() : "",
      regionId: regionId || null,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto"
    >
      <div className="flex items-center gap-2">
        <span
          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-sm"
          style={{ backgroundColor: meta.color }}
        >
          {meta.emoji}
        </span>
        <h2 className="text-lg font-semibold">
          {mode === "create" ? "Nový bod" : "Upravit bod"} — {meta.label}
        </h2>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-kraj-muted">
          Název {isMessageBox && "(nepovinný)"}
        </span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required={!isMessageBox}
          placeholder={isMessageBox ? "Schránka se vzkazem" : ""}
          className="rounded-lg border border-kraj-border bg-kraj-bg2 px-3 py-2 outline-none focus:border-kraj-accent"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-kraj-muted">
          {isMessageBox ? "Text vzkazu" : "Popis"}
        </span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required={isMessageBox}
          rows={isMessageBox ? 4 : 3}
          className="resize-y rounded-lg border border-kraj-border bg-kraj-bg2 px-3 py-2 outline-none focus:border-kraj-accent"
        />
      </label>

      {showHint && (
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-kraj-muted">
            Nápověda k nalezení (nepovinné)
          </span>
          <textarea
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            rows={2}
            placeholder="Kde a jak to najít…"
            className="resize-y rounded-lg border border-kraj-border bg-kraj-bg2 px-3 py-2 outline-none focus:border-kraj-accent"
          />
        </label>
      )}

      {isAr && (
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-kraj-muted">
            AR obsah — odkaz / identifikátor (placeholder pro budoucí fázi)
          </span>
          <input
            type="text"
            value={arContent}
            onChange={(e) => setArContent(e.target.value)}
            className="rounded-lg border border-kraj-border bg-kraj-bg2 px-3 py-2 outline-none focus:border-kraj-accent"
          />
        </label>
      )}

      <div className="flex flex-col gap-2 text-sm">
        <span className="text-kraj-muted">Fotky (nepovinné)</span>
        {images.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {images.map((url) => (
              <div key={url} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt="fotka bodu"
                  className="h-16 w-16 rounded-md border border-kraj-border object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  aria-label="Odebrat fotku"
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-kraj-border bg-kraj-bg2 text-xs"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        {images.length < MAX_PHOTOS && (
          <label className="w-fit cursor-pointer rounded-lg border border-dashed border-kraj-border px-3 py-2 text-kraj-muted hover:text-kraj-fg">
            {uploading ? "Nahrávám…" : "＋ Přidat fotku"}
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={uploading}
              className="hidden"
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        )}
        {uploadError && <p className="text-xs text-red-300">{uploadError}</p>}
      </div>

      {regions.length > 0 && (
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-kraj-muted">Oblast (kraj)</span>
          <select
            value={regionId}
            onChange={(e) => setRegionId(e.target.value)}
            className="rounded-lg border border-kraj-border bg-kraj-bg2 px-3 py-2 outline-none focus:border-kraj-accent"
          >
            <option value="">— bez oblasti —</option>
            {regions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
      )}

      {shareable && (
        <fieldset className="flex flex-col gap-2 text-sm">
          <span className="text-kraj-muted">Kdo to uvidí</span>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="visibility"
              checked={visibility === "public"}
              onChange={() => setVisibility("public")}
            />
            Veřejně všem
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="visibility"
              checked={visibility === "private_user"}
              onChange={() => setVisibility("private_user")}
            />
            Jen konkrétnímu uživateli
          </label>

          {visibility === "private_user" && (
            <div className="mt-1 flex flex-col gap-2">
              <div className="flex flex-wrap gap-3 text-sm">
                <label className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    name="recipientMode"
                    checked={recipientMode === "user"}
                    onChange={() => setRecipientMode("user")}
                  />
                  Uživateli v aplikaci
                </label>
                <label className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    name="recipientMode"
                    checked={recipientMode === "email"}
                    onChange={() => setRecipientMode("email")}
                  />
                  Pozvat e-mailem
                </label>
              </div>

              {recipientMode === "user" ? (
                <select
                  value={recipientId}
                  onChange={(e) => setRecipientId(e.target.value)}
                  required
                  className="rounded-lg border border-kraj-border bg-kraj-bg2 px-3 py-2 outline-none focus:border-kraj-accent"
                >
                  <option value="">— vyber příjemce —</option>
                  {recipients.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              ) : (
                <>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    required
                    placeholder="jmeno@email.cz"
                    className="rounded-lg border border-kraj-border bg-kraj-bg2 px-3 py-2 outline-none focus:border-kraj-accent"
                  />
                  <span className="text-xs text-kraj-muted">
                    Pokud tu ještě není, přijde mu pozvánka a bod uvidí po
                    registraci se stejným e-mailem.
                  </span>
                </>
              )}
            </div>
          )}
        </fieldset>
      )}

      <p className="text-xs text-kraj-muted">
        Poloha: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
      </p>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="mt-1 flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="flex-1 rounded-lg bg-kraj-accent px-4 py-2.5 font-medium text-kraj-bg transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {busy ? "Ukládám…" : mode === "create" ? "Založit" : "Uložit"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="rounded-lg border border-kraj-border px-4 py-2.5 text-kraj-muted transition-colors hover:text-kraj-fg"
        >
          Zrušit
        </button>
      </div>
    </form>
  );
}
