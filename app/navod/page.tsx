import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Návod" };

export default function NavodPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-10">
      <h1 className="text-3xl font-semibold">Návod — jak hrát Skrytokraj</h1>
      <p className="mt-3 text-kraj-muted">
        Skrytokraj je hra na pomezí krajiny a příběhu. V reálném terénu hledáš
        místa, plníš úkoly, necháváš a nacházíš schránky a poklady a pomáháš psát
        kroniku skrytého kraje.
      </p>

      <Step n="1" title="Založ si účet a přihlas se">
        Klikni na <strong>Založit účet</strong>, vyplň jméno, e-mail a heslo.
        Mapa a objekty jsou jen pro přihlášené.
      </Step>

      <Step n="2" title="Otevři Mapu a povol polohu">
        V menu zvol <strong>Mapa</strong>. Když povolíš přístup k poloze (tlačítko{" "}
        📍 vpravo nahoře), mapa tě ukáže tam, kde právě jsi. Vlevo nahoře uvidíš i
        své přesné souřadnice (funguje i offline).
      </Step>

      <Step n="3" title="Prohlížej objekty">
        Body na mapě mají různé ikony podle typu — úkol ❓, poklad ⭐, příběhové
        místo 📖, AR místo ✨, schránka se vzkazem ✉️. Klepnutím se otevře krátký
        náhled; <strong>„Otevřít detail →"</strong> ukáže celý příběh, nápovědu a
        fotky.
      </Step>

      <Step n="4" title="Zakládej vlastní objekty">
        Na mapě klepni na <strong>Přidat poklad</strong> nebo{" "}
        <strong>Přidat schránku se vzkazem</strong>. Umísti bod{" "}
        <strong>klepnutím do mapy</strong> nebo <strong>„Použít mou polohu"</strong>{" "}
        (přesně tam, kde stojíš). Vyplň název, popis, případně dlouhý text/kroniku,
        nápovědu k nalezení a přidej fotky (z fotoaparátu i galerie — samy se
        optimalizují). Bod jde pak přetáhnout na přesné místo.
      </Step>

      <Step n="5" title="Veřejně, nebo jen pro někoho">
        U schránek a pokladů volíš viditelnost: <strong>veřejně všem</strong>, nebo{" "}
        <strong>jen konkrétnímu člověku</strong> — buď vybereš uživatele, nebo
        zadáš e-mail (pokud tu ještě není, přijde mu pozvánka a objekt uvidí po
        registraci se stejným e-mailem). Objekt jen pro tebe pozná mapa zlatou září
        a 🎁.
      </Step>

      <Step n="6" title="Plň úkoly">
        Úkoly (a poklady) mohou mít <strong>správnou odpověď / kód</strong>. V
        detailu ji zadáš — posuzuje se shovívavě (nezáleží na velikosti písmen a
        diakritice). Když sedí, objekt dostane ✓ a máš ho splněný.
      </Step>

      <Step n="7" title="Offline v terénu">
        Než vyrazíš bez signálu, <strong>otevři appku a mapu ještě online</strong>{" "}
        (třeba doma) — kraj, který si prohlédneš, pak funguje i offline. Poloha
        (GPS) funguje offline vždy.
      </Step>

      <Step n="8" title="Hraj férově">
        Přečti si prosím{" "}
        <Link href="/podminky" className="text-kraj-accent hover:underline">
          podmínky použití
        </Link>{" "}
        — hlavně: neškodit krajině a majetku, používat veřejná místa, žádné
        vulgarismy, násilí ani pranky. U každého objektu je tlačítko{" "}
        <strong>„Nahlásit"</strong>, kdyby něco nebylo v pořádku.
      </Step>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/mapa"
          className="rounded-lg bg-kraj-accent px-5 py-3 font-medium text-kraj-bg hover:opacity-90"
        >
          Otevřít mapu
        </Link>
        <Link
          href="/podminky"
          className="rounded-lg border border-kraj-border px-5 py-3 font-medium hover:bg-kraj-panel"
        >
          Podmínky použití
        </Link>
      </div>
    </div>
  );
}

function Step({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-7 flex gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-kraj-panel text-sm font-semibold text-kraj-accent">
        {n}
      </span>
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-1 leading-relaxed text-kraj-muted">{children}</p>
      </div>
    </section>
  );
}
