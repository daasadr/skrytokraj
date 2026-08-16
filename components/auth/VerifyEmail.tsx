"use client";

import { useActionState } from "react";
import Link from "next/link";
import { verifyEmailAction, type VerifyState } from "@/lib/actions/auth";

const initial: VerifyState = { error: null, ok: false };

export function VerifyEmail({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(
    verifyEmailAction,
    initial,
  );

  if (state.ok) {
    return (
      <div className="flex flex-col gap-3">
        <p className="rounded-lg border border-kraj-border bg-kraj-panel px-3 py-3 text-sm text-kraj-fg">
          Hotovo — e-mail je potvrzený. Díky! 🌿
        </p>
        <Link href="/mapa" className="text-sm text-kraj-accent hover:underline">
          Zpět do hry
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
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
        {pending ? "Potvrzuji…" : "Potvrdit e-mail"}
      </button>
    </form>
  );
}
