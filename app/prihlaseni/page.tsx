import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Přihlášení" };

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/mapa");

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-5 py-12">
      <h1 className="mb-1 text-2xl font-semibold">Vítej zpět, kronikáři</h1>
      <p className="mb-7 text-sm text-kraj-muted">
        Přihlas se a pokračuj v naslouchání kraji.
      </p>
      <LoginForm />
    </div>
  );
}
