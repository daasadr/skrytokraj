import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";

// Ochrana celé admin sekce — jen pro roli admin. (Přihlášení hlídá i proxy.ts,
// tady navíc kontrolujeme roli.)
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/prihlaseni");
  if (session.user.role !== "admin") redirect("/mapa");

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center gap-3 border-b border-kraj-border pb-4">
        <h1 className="text-xl font-semibold">Správa</h1>
        <nav className="flex gap-1 text-sm">
          <Link
            href="/admin"
            className="rounded-md px-3 py-1.5 text-kraj-muted hover:bg-kraj-panel hover:text-kraj-fg"
          >
            Přehled
          </Link>
          <Link
            href="/admin/uzivatele"
            className="rounded-md px-3 py-1.5 text-kraj-muted hover:bg-kraj-panel hover:text-kraj-fg"
          >
            Uživatelé
          </Link>
        </nav>
      </div>
      {children}
    </div>
  );
}
