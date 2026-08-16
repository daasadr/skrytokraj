"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { registerAction, type AuthFormState } from "@/lib/actions/auth";

const initial: AuthFormState = { error: null };

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, initial);
  // Řízená pole, ať jméno a e-mail zůstanou po chybě vyplněné (hesla se smažou).
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-kraj-muted">Jméno nebo přezdívka</span>
        <input
          type="text"
          name="name"
          required
          autoComplete="nickname"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-kraj-border bg-kraj-bg2 px-3 py-2.5 outline-none focus:border-kraj-accent"
        />
      </label>

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
        <span className="text-kraj-muted">Heslo (min. 8 znaků)</span>
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

      <label className="flex items-start gap-2 text-sm text-kraj-muted">
        <input type="checkbox" name="terms" required className="mt-1" />
        <span>
          Souhlasím s{" "}
          <Link
            href="/podminky"
            target="_blank"
            className="text-kraj-accent hover:underline"
          >
            podmínkami použití
          </Link>{" "}
          (fér hra, žádné vulgarismy ani pranky).
        </span>
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
        {pending ? "Zakládám účet…" : "Založit účet"}
      </button>

      <p className="text-center text-xs text-kraj-muted">
        Po registraci ti přijde nepovinný potvrzovací e-mail — hodí se pro
        pozdější obnovu zapomenutého hesla.
      </p>

      <p className="text-center text-sm text-kraj-muted">
        Už máš účet?{" "}
        <Link href="/prihlaseni" className="text-kraj-accent hover:underline">
          Přihlas se
        </Link>
      </p>
    </form>
  );
}
