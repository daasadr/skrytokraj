"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { loginAction, type AuthFormState } from "@/lib/actions/auth";

const initial: AuthFormState = { error: null };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initial);
  // Řízené pole, ať e-mail zůstane vyplněný i po chybném přihlášení
  // (React 19 jinak formulář po akci resetuje).
  const [email, setEmail] = useState("");

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

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-kraj-muted">Heslo</span>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
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
        className="mt-1 rounded-lg bg-kraj-accent px-4 py-2.5 font-medium text-kraj-bg transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Přihlašuji…" : "Přihlásit se"}
      </button>

      <p className="text-center text-sm text-kraj-muted">
        Ještě nemáš účet?{" "}
        <Link href="/registrace" className="text-kraj-accent hover:underline">
          Založ si ho
        </Link>
      </p>
    </form>
  );
}
