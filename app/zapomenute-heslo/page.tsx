import type { Metadata } from "next";
import { ForgotForm } from "@/components/auth/ForgotForm";

export const metadata: Metadata = { title: "Zapomenuté heslo" };

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-5 py-12">
      <h1 className="mb-1 text-2xl font-semibold">Zapomenuté heslo</h1>
      <p className="mb-7 text-sm text-kraj-muted">
        Zadej e-mail a pošleme ti odkaz pro nastavení nového hesla.
      </p>
      <ForgotForm />
    </div>
  );
}
