"use client";

import { useState } from "react";

// Zadání odpovědi na úkol. onSolve vrací true, když je odpověď správná.
export function QuestSolve({
  onSolve,
}: {
  onSolve: (answer: string) => Promise<boolean>;
}) {
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "wrong">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    setStatus("checking");
    const ok = await onSolve(value.trim());
    if (!ok) setStatus("wrong");
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-1.5">
      <span className="text-xs text-kraj-muted">Zadej odpověď:</span>
      <div className="flex gap-1.5">
        <input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setStatus("idle");
          }}
          className="flex-1 rounded-md border border-kraj-border bg-kraj-bg2 px-2 py-1 text-sm outline-none focus:border-kraj-accent"
        />
        <button
          type="submit"
          disabled={status === "checking"}
          className="rounded-md bg-kraj-accent px-2.5 py-1 text-sm font-medium text-kraj-bg disabled:opacity-60"
        >
          {status === "checking" ? "…" : "Ověřit"}
        </button>
      </div>
      {status === "wrong" && (
        <span className="text-xs text-red-300">
          Není to ono. Zkus naslouchat pozorněji. 🌿
        </span>
      )}
    </form>
  );
}
