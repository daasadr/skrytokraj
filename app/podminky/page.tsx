import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Podmínky použití" };

export default function PodminkyPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-10">
      <h1 className="text-3xl font-semibold">Podmínky použití Skrytokraje</h1>
      <p className="mt-3 text-kraj-muted">
        Skrytokraj je hra o krajině, příbězích a naslouchání. Držíme jen pár
        férových pravidel — méně přísných než klasický geocaching, ale o to
        důležitějších. Používáním appky s nimi souhlasíš.
      </p>

      <Section title="1. Neškoď krajině ani majetku">
        Při ukládání objektů (schránek, pokladů) <strong>nezpůsobuj škody</strong>{" "}
        na pozemcích, přírodě ani majetku. Nic nenič, nekopej tam, kde nemáš, nic
        nepoškozuj.
      </Section>

      <Section title="2. Používej veřejná místa">
        Objekty umisťuj na <strong>veřejně přístupná místa</strong>. Nikdy tak, aby
        kvůli hledání musel někdo vstupovat na cizí pozemek, do budov nebo se
        dokonce někam vloupat. Bezpečí hráčů i okolí je na prvním místě.
      </Section>

      <Section title="3. Volnost tvorby">
        Není omezeno, jak <strong>daleko</strong> od sebe objekty jsou, ani kolik
        jich je. Objekty <strong>nemusí procházet schválením</strong> — tvoř
        svobodně. (Pokud by se ale začal objevovat nevhodný obsah, můžeme
        přistoupit ke kontrole.)
      </Section>

      <Section title="4. Co je zakázané">
        Skrytokraj <strong>opravdu není</strong> na tyto věci a nebudeme je
        tolerovat:
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>vulgarismy,</li>
          <li>násilí a poškozování kohokoli,</li>
          <li>zlé úmysly a škodlivé použití,</li>
          <li>
            pranky — na tohle appka opravdu není a{" "}
            <strong>prankeři budou diskvalifikováni</strong>.
          </li>
        </ul>
        Veřejné objekty mohou být <strong>zkontrolovány</strong> kvůli vhodnosti
        obsahu.
      </Section>

      <Section title="5. Soukromé objekty jsou skutečně soukromé">
        Objekt nasdílený jen konkrétnímu člověku vidí <strong>jen ti dva</strong> —
        nekouká do něj ani admin, ani autorka projektu. Zavazuješ se ale používat
        soukromé objekty <strong>stejně férově</strong> jako veřejné (bez
        vulgarismů, násilí a pranků).
        <br />
        <br />
        Výjimka: pokud jeden z dvojice objekt <strong>nahlásí</strong> (tlačítko
        „Nahlásit"), obsah se zpřístupní adminovi k prošetření. Jinak zůstává
        soukromý.
      </Section>

      <Section title="6. Nevhodné objekty odstraníme — online i v krajině">
        Objekty (veřejné i soukromé) založené se <strong>špatným úmyslem</strong>{" "}
        budou <strong>zlikvidovány</strong> — smazány z mapy i fyzicky odstraněny z
        krajiny. Autorovi může být účet zablokován.
      </Section>

      <Section title="7. Nahlášení nevhodného použití">
        U každého objektu je tlačítko <strong>„Nahlásit"</strong> (v detailu bodu).
        Nahlásit lze veřejný i soukromý objekt. Nahlášení dorazí správci (a
        e-mailem autorce projektu) a co nejdřív se jím zabýváme. Nahlásit se dá i
        napsáním na{" "}
        <a
          href="mailto:daasa.d@seznam.cz"
          className="text-kraj-accent hover:underline"
        >
          daasa.d@seznam.cz
        </a>
        .
      </Section>

      <p className="mt-10 text-sm text-kraj-muted">
        Nový? Mrkni na{" "}
        <Link href="/navod" className="text-kraj-accent hover:underline">
          návod
        </Link>
        .
      </p>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-7">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-2 leading-relaxed text-kraj-muted">{children}</div>
    </section>
  );
}
