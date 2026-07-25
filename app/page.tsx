import Link from "next/link";
import { auth } from "@/auth";

export default async function HomePage() {
  const session = await auth();
  const loggedIn = !!session?.user;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-5 py-16">
      <p className="mb-4 text-sm uppercase tracking-[0.2em] text-kraj-mist">
        Kronika skrytého kraje
      </p>
      <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
        Kraj kolem Lubiny
        <br />
        nebyl vždycky jen tím, čím je dnes.
      </h1>

      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-kraj-muted">
        Skrytokraj je hra na pomezí krajiny a příběhu. V okolí Petřvaldu na
        Novojičínsku — v Trnávce, Staré Vsi, Skotnici, Petřvaldíku a dál — hledáš
        <span className="text-kraj-accent"> skuliny</span>, místa, kde je vrstva
        světa nejtenčí. Plníš úkoly, hledáš poklady, necháváš vzkazy a pomáháš
        psát kroniku toho, co ostatní odbydou úsměvem.
      </p>

      <div className="mt-9 flex flex-wrap gap-3">
        <Link
          href="/mapa"
          className="rounded-lg bg-kraj-accent px-5 py-3 font-medium text-kraj-bg transition-opacity hover:opacity-90"
        >
          Otevřít Mapu Skrytokraje
        </Link>
        {!loggedIn && (
          <Link
            href="/registrace"
            className="rounded-lg border border-kraj-border px-5 py-3 font-medium text-kraj-fg transition-colors hover:bg-kraj-panel"
          >
            Stát se kronikářem
          </Link>
        )}
      </div>

      <blockquote className="mt-14 border-l-2 border-kraj-border pl-5 italic text-kraj-muted">
        „Místa, kde je vrstva nejtenčí, se nazývají Skuliny — a ti, kdo je
        hledají a zaznamenávají, co za nimi najdou, jsou Kronikáři Skrytokraje.
        Tahle kniha je jejich kronika. Teprve se píše."
      </blockquote>
    </div>
  );
}
