import Link from "next/link";
import Image from "next/image";
import type { Role } from "@/generated/prisma/client";
import { logoutAction } from "@/lib/actions/auth";

interface SiteHeaderProps {
  user: { name: string; role: Role } | null;
}

// Hlavní navigace. Sekce Kronika a Vzkazy jsou zatím placeholdery pro
// budoucí fáze (viz PROJECT.md) — v menu jsou, ale obsah přijde později.
const NAV = [
  { href: "/", label: "Úvod" },
  { href: "/mapa", label: "Mapa" },
  { href: "/kronika", label: "Kronika" },
];

export function SiteHeader({ user }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-kraj-border bg-kraj-bg/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <Image
            src="/icon.svg"
            alt=""
            width={30}
            height={30}
            className="rounded-md"
          />
          <span className="text-lg font-semibold tracking-wide">
            Skrytokraj
          </span>
        </Link>

        <nav className="ml-2 hidden gap-1 sm:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-1.5 text-sm text-kraj-muted transition-colors hover:bg-kraj-panel hover:text-kraj-fg"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden text-sm text-kraj-muted sm:inline">
                {user.name}
                {user.role === "admin" && (
                  <span className="ml-1.5 rounded bg-kraj-gold/15 px-1.5 py-0.5 text-xs text-kraj-gold">
                    admin
                  </span>
                )}
              </span>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-md border border-kraj-border px-3 py-1.5 text-sm text-kraj-muted transition-colors hover:text-kraj-fg"
                >
                  Odhlásit
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/prihlaseni"
                className="rounded-md px-3 py-1.5 text-sm text-kraj-muted transition-colors hover:text-kraj-fg"
              >
                Přihlásit
              </Link>
              <Link
                href="/registrace"
                className="rounded-md bg-kraj-accent px-3 py-1.5 text-sm font-medium text-kraj-bg transition-opacity hover:opacity-90"
              >
                Založit účet
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobilní navigace (odkazy pod hlavičkou) */}
      <nav className="flex gap-1 overflow-x-auto border-t border-kraj-border px-4 py-2 sm:hidden">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm text-kraj-muted hover:text-kraj-fg"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
