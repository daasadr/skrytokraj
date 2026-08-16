"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetPasswordAction, type ResetState } from "@/lib/actions/auth";

const initial: ResetState = { error: null, done: false };

export function ResetForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(
    resetPasswordAction,
    initial,
  );

  if (state.done) {
    return (
      <div className="flex flex-col gap-3">
        <p className="rounded-lg border border-kraj-border bg-kraj-panel px-3 py-3 text-sm text-kraj-fg">
          Heslo bylo změněno. Teď se můžeš přihlásit novým heslem.
        </p>
        <Link
          href="/prihlaseni"
          className="rounded-lg bg-kraj-accent px-4 py-2.5 text-center font-medium text-kraj-bg"
        >
          Přihlásit se
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-kraj-muted">Nové heslo (min. 8 znaků)</span>
        <input
          type="password"
          name="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="rounded-lg border border-kraj-border bg-kraj-bg2 px-3 py-2.5 outline-none focus:border-kraj-accent"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-kraj-muted">Heslo znovu</span>
        <input
          type="password"
          name="passwordAgain"
          required
          minLength={8}
          autoComplete="new-password"
          className="rounded-lg border border-kraj-border bg-kraj-bg2 px-3 py-2.5 outline-none focus:border-kraj-accent"
        />
      </label>

      {state.error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-kraj-accent px-4 py-2.5 font-medium text-kraj-bg transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Ukládám…" : "Nastavit nové heslo"}
      </button>
    </form>
  );
}
