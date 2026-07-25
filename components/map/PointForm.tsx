"use client";

import { useState } from "react";
import type { MapPointTypeKey } from "@/lib/mapPoints";
import { MAP_POINT_TYPES } from "@/lib/mapPoints";
import type { UserOption } from "@/lib/points";

export interface PointFormValues {
  name: string;
  description: string;
  visibility: "public" | "private_user";
  recipientId: string | null;
  arContent: string;
}

interface PointFormProps {
  type: MapPointTypeKey;
  mode: "create" | "edit";
  coords: { lat: number; lng: number };
  users: UserOption[];
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

  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [visibility, setVisibility] = useState<"public" | "private_user">(
    initial?.visibility ?? "public",
  );
  const [recipientId, setRecipientId] = useState<string>(
    initial?.recipientId ?? "",
  );
  const [arContent, setArContent] = useState(initial?.arContent ?? "");

  const recipients = users.filter((u) => u.id !== currentUserId);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      name: name.trim(),
      description: description.trim(),
      visibility: isMessageBox ? visibility : "public",
      recipientId:
        isMessageBox && visibility === "private_user"
          ? recipientId || null
          : null,
      arContent: isAr ? arContent.trim() : "",
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

      {isMessageBox && (
        <fieldset className="flex flex-col gap-2 text-sm">
          <span className="text-kraj-muted">Kdo vzkaz uvidí</span>
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
            <select
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value)}
              required
              className="mt-1 rounded-lg border border-kraj-border bg-kraj-bg2 px-3 py-2 outline-none focus:border-kraj-accent"
            >
              <option value="">— vyber příjemce —</option>
              {recipients.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
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
