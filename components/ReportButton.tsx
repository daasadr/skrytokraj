"use client";

import { useState } from "react";
import { REPORT_CATEGORIES } from "@/lib/reports";

// Tlačítko + formulář pro nahlášení objektu (veřejného i soukromého).
export function ReportButton({
  pointId,
  pointName,
}: {
  pointId: string;
  pointName: string;
}) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!category || !message.trim()) {
      setError("Vyber důvod a napiš, o co jde.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pointId, category, message: message.trim() }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(d?.error ?? "Nahlášení se nepovedlo.");
        return;
      }
      setDone(true);
    } catch {
      setError("Chyba připojení.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-kraj-muted underline hover:text-red-300"
      >
        Nahlásit
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-kraj-border bg-kraj-bg2 p-5 text-kraj-fg"
            onClick={(e) => e.stopPropagation()}
          >
            {done ? (
              <div className="flex flex-col gap-3">
                <h2 className="text-lg font-semibold">Děkujeme za nahlášení</h2>
                <p className="text-sm text-kraj-muted">
                  Podíváme se na to co nejdřív. Objekty se špatným úmyslem
                  odstraníme online i v krajině.
                </p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="self-start rounded-lg bg-kraj-accent px-4 py-2 text-sm font-medium text-kraj-bg"
                >
                  Zavřít
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="flex flex-col gap-3">
                <h2 className="text-lg font-semibold">Nahlásit objekt</h2>
                <p className="text-sm text-kraj-muted">„{pointName}"</p>

                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-kraj-muted">Důvod</span>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                    className="rounded-lg border border-kraj-border bg-kraj-bg px-3 py-2 outline-none focus:border-kraj-accent"
                  >
                    <option value="">— vyber —</option>
                    {REPORT_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-kraj-muted">Popis</span>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={4}
                    placeholder="Co je na objektu nevhodné?"
                    className="resize-y rounded-lg border border-kraj-border bg-kraj-bg px-3 py-2 outline-none focus:border-kraj-accent"
                  />
                </label>

                {error && (
                  <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                    {error}
                  </p>
                )}

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={busy}
                    className="rounded-lg bg-kraj-accent px-4 py-2 text-sm font-medium text-kraj-bg disabled:opacity-60"
                  >
                    {busy ? "Odesílám…" : "Odeslat nahlášení"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-lg border border-kraj-border px-4 py-2 text-sm text-kraj-muted"
                  >
                    Zrušit
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
