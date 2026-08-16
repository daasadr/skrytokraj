import type { Metadata } from "next";
import { VerifyEmail } from "@/components/auth/VerifyEmail";

export const metadata: Metadata = { title: "Potvrzení e-mailu" };

export default async function VerifyEmailPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-5 py-12">
      <h1 className="mb-1 text-2xl font-semibold">Potvrzení e-mailu</h1>
      <p className="mb-7 text-sm text-kraj-muted">
        Klepnutím potvrdíš svůj e-mail (hodí se pro pozdější obnovu hesla).
      </p>
      <VerifyEmail token={token} />
    </div>
  );
}
