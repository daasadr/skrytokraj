"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { forgotPasswordAction, type ForgotState } from "@/lib/actions/auth";

const initial: ForgotState = { error: null, sent: false };

export function ForgotForm() {
  const [state, formAction, pending] = useActionState(
    forgotPasswordAction,
    initial,
  );
  const [email, setEmail] = useState("");

  if (state.sent) {
    return (
      <div className="flex flex-col gap-3">
        <p className="rounded-lg border border-kraj-border bg-kraj-panel px-3 py-3 text-sm text-kraj-fg">
          Pokud u nás účet s tímto e-mailem existuje, poslali jsme na něj odkaz
          pro nastavení nového hesla. Zkontroluj i složku spam.
        </p>
        <Link href="/prihlaseni" className="text-sm text-kraj-accent hover:underline">
          Zpět na přihlášení
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-kraj-muted">E-mail</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
        {pending ? "Odesílám…" : "Poslat odkaz pro obnovu"}
      </button>

      <Link
        href="/prihlaseni"
        className="text-center text-sm text-kraj-muted hover:text-kraj-fg"
      >
        Zpět na přihlášení
      </Link>
    </form>
  );
}
