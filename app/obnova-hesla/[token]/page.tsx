import type { Metadata } from "next";
import { ResetForm } from "@/components/auth/ResetForm";

export const metadata: Metadata = { title: "Obnova hesla" };

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-5 py-12">
      <h1 className="mb-1 text-2xl font-semibold">Nové heslo</h1>
      <p className="mb-7 text-sm text-kraj-muted">
        Nastav si nové heslo ke Skrytokraji.
      </p>
      <ResetForm token={token} />
    </div>
  );
}
