import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Kronika" };

// Placeholder pro budoucí fázi — sekce s příběhy a texty kroniky zatím není
// součástí fáze 1 (viz ZADANI / PROJECT.md). Necháváme jen strukturu a náladu.
export default function KronikaPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-16">
      <p className="mb-3 text-sm uppercase tracking-[0.2em] text-kraj-mist">
        Připravuje se
      </p>
      <h1 className="text-3xl font-semibold">Kronika Skrytokraje</h1>
      <p className="mt-5 max-w-2xl leading-relaxed text-kraj-muted">
        Sem se jednou sepíšou báje kraje — Skrytci z Hončovy hůrky, páví strážci
        Petřvaldu, Paní mlh z Poodří, propadlá vesnice Harty a další. Zatím je
        tahle kapitola prázdná; příběhy přijdou v další fázi. Do té doby se
        vydej na mapu — kraj se ozývá tam.
      </p>
      <Link
        href="/mapa"
        className="mt-8 inline-block rounded-lg bg-kraj-accent px-5 py-3 font-medium text-kraj-bg transition-opacity hover:opacity-90"
      >
        Otevřít mapu
      </Link>
    </div>
  );
}
