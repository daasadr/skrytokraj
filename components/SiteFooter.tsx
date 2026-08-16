import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-kraj-border px-4 py-5 text-sm text-kraj-muted">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-5 gap-y-2">
        <span className="text-kraj-fg">Skrytokraj</span>
        <Link href="/navod" className="hover:text-kraj-fg">
          Návod
        </Link>
        <Link href="/podminky" className="hover:text-kraj-fg">
          Podmínky použití
        </Link>
        <a
          href="mailto:daasa.d@seznam.cz"
          className="hover:text-kraj-fg"
        >
          Kontakt
        </a>
      </div>
    </footer>
  );
}
