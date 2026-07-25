import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = { title: "Registrace" };

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/mapa");

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-5 py-12">
      <h1 className="mb-1 text-2xl font-semibold">Stát se kronikářem</h1>
      <p className="mb-7 text-sm text-kraj-muted">
        Založ si účet a začni zaznamenávat, co ostatní přehlédnou.
      </p>
      <RegisterForm />
    </div>
  );
}
