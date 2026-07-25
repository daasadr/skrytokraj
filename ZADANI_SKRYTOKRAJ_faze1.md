# Zadání pro Claude Code — Skrytokraj, fáze 1: kostra webu + Mapa Skrytokraje

## Kontext projektu (pro pochopení, ne k okamžité implementaci)

Skrytokraj je lokální hra typu geocaching s příběhovým a fantasy přesahem, zasazená do
oblasti kolem Petřvaldu na Novojičínsku (řeka Lubina, region Poodří, okolní vesnice
Trnávka, Skotnice, Stará Ves nad Ondřejnicí a další, do budoucna se bude rozšiřovat).
Hráči hledají fyzická i AR místa v krajině, plní úkoly, hledají poklady a schránky se
vzkazy, a postupně odhalují mytologii kraje (vlastní kosmologie "Skrytokraj" — Kronika
skrytého kraje).

Tohle zadání se týká **první fáze**: postavit funkční kostru webu a v ní jednu klíčovou
funkční část — **Mapu Skrytokraje**. Zbytek (uživatelský obsah příběhů, chat, další
sekce menu) přijde v dalších fázích a NENÍ součástí tohoto zadání — stačí pro ně
připravit strukturu, ne je stavět.

---

## Cíl fáze 1

1. Funkční kostra webu (Next.js), nasaditelná jako PWA — má fungovat rozumně i na
   mobilu, ideálně jako "web-app", kterou si uživatel může přidat na plochu telefonu.
2. Základní systém uživatelských účtů se dvěma rolemi: **admin** a **user**.
3. Hlavní funkční kus: **položka menu "Mapa Skrytokraje"** obsahující:
   - reálnou mapu s živým ukazatelem polohy uživatele (geolokace v prohlížeči)
   - zobrazení bodů zájmu na mapě (úkoly, poklady, schránky se vzkazy, AR místa)
   - admin může na mapě zakládat/editovat/mazat libovolné body (úkoly, poklady,
     příběhová místa, AR místa)
   - běžný uživatel může zakládat **schránky se vzkazy** (message boxy) — s možností
     nastavit viditelnost buď **veřejně všem**, nebo **jen konkrétnímu vybranému
     uživateli**
4. Založit a průběžně udržovat soubor `PROJECT.md` v rootu repozitáře — viz sekce níže.

---

## Doporučený tech stack

- **Next.js** (App Router), TypeScript
- **PostgreSQL** s rozšířením **PostGIS** pro práci s geodaty (souřadnice bodů, dotazy
  typu "body v okolí")
- **Prisma** jako ORM (pokud podpora PostGIS přes Prisma dělá problém, zvaž raw SQL
  dotazy pro geo-operace nebo knihovnu jako `prisma-postgis` — rozhodni podle
  aktuálního stavu ekosystému a napiš zdůvodnění do PROJECT.md)
- **Auth**: NextAuth.js (Auth.js) s jednoduchým email/heslo přihlášením pro start;
  struktura má počítat s rolemi (`admin`, `user`) uloženými u uživatele
- **Mapa**: Mapbox GL JS (příp. `react-map-gl` jako wrapper) — autorka preferuje
  Mapbox před Google Maps
- **PWA**: `next-pwa` nebo obdobné řešení pro manifest + service worker, aby šla
  stránka nainstalovat na mobil
- **Docker**: připrav `docker-compose.yml` pro lokální vývoj (app + postgres/postgis),
  konzistentní s tím, jak autorka nasazuje ostatní projekty (Hetzner VPS, Docker
  kontejnery pro izolaci klientů) — i když ostrá deployment konfigurace není součástí
  téhle fáze, struktura by tomu měla odpovídat

Pokud některá volba z výše uvedeného narazí na praktický problém (verze, kompatibilita,
chybějící balíček), zvol nejbližší rozumnou alternativu a **zapiš rozhodnutí a důvod do
PROJECT.md**, ať to autorka projektu vidí a může to zpětně zkontrolovat.

---

## Datový model — návrh (uprav podle potřeby, ale zachovej princip)

**User**
- id, email, jméno, heslo (hash), role (`admin` | `user`), vytvořeno

**MapPoint** — jeden bod na mapě, se sdíleným základem a rozlišením podle typu
- id, typ (`quest` | `treasure` | `story_location` | `ar_location` | `message_box`)
- souřadnice (lat/lng, případně PostGIS geometry point)
- název, popis (text, může být delší — u úkolů a příběhových míst)
- vytvořil (user id), vytvořeno, upraveno
- viditelnost: `public` (vidí všichni) | `private_user` (vidí jen konkrétní uživatel,
  vazba na user id) — u typu `message_box` je tohle klíčové, u ostatních typů může
  být zatím vždy `public`, protože ty zakládá jen admin
- stav/aktivní (bool) — pro pozdější možnost bod deaktivovat, aniž by se mazal
- volitelně: pole pro AR obsah (odkaz/identifikátor AR modelu) — u typu `ar_location`,
  klidně jako prázdný placeholder pro budoucí fázi, nemusí být funkční hned

Zvaž, jestli je lepší mít jednu tabulku `MapPoint` s enum typem, nebo oddělit
`MessageBox` do vlastní tabulky kvůli odlišné logice viditelnosti — rozhodni podle
toho, co dá čistší kód, a zdůvodnění zapiš do PROJECT.md.

---

## Funkční požadavky na Mapu Skrytokraje

### Pro všechny přihlášené uživatele
- zobrazení mapy s aktuální polohou (geolokace prohlížeče, s ošetřením stavu, kdy
  uživatel polohu nepovolí)
- zobrazení všech `public` bodů na mapě + `private_user` bodů, které jsou určené
  právě jim
- kliknutí na bod zobrazí detail (název, popis, typ, případně kdo ho založil)
- možnost založit novou schránku se vzkazem (`message_box`): text vzkazu, souřadnice
  (buď kliknutím na mapu, nebo podle aktuální polohy), volba viditelnosti — veřejně /
  konkrétnímu uživateli (výběr ze seznamu registrovaných uživatelů)

### Pouze pro adminy
- zakládání/editace/mazání bodů typu `quest`, `treasure`, `story_location`,
  `ar_location` — s poli podle typu (viz datový model)
- jednoduché rozlišení v UI, že admin vidí navíc "přidat místo" s výběrem typu, zatímco
  běžný uživatel vidí jen "přidat schránku se vzkazem"

### Vizuální odlišení na mapě
- různé body by měly mít odlišnou ikonu/barvu podle typu (úkol, poklad, příběhové
  místo, AR místo, schránka) — použij zatím jednoduché, ale jasně odlišitelné
  ikony/barvy, detailní grafický styl přijde později

---

## Soubor PROJECT.md — povinná součást hned od začátku

V rootu repozitáře založ soubor `PROJECT.md` a od začátku ho udržuj aktuální. Má
sloužit jako průběžný přehled stavu projektu pro autorku, která se do kódu nemusí
dívat každý den. Struktura:

```markdown
# Skrytokraj — přehled projektu

## O projektu
(stručný popis hry a webu, 3–5 vět)

## Tech stack
(seznam technologií a klíčová rozhodnutí + proč)

## Aktuální stav
(1–2 věty, co teď funguje)

## Hotovo
- [datum] co bylo dokončeno

## Pracuje se na
- co je rozpracované

## TODO / další kroky
- co je potřeba udělat (i drobnosti)

## Rozhodnutí a poznámky
- technická rozhodnutí, kompromisy, věci, na které je třeba upozornit autorku
- otevřené otázky, na které autorka bude muset odpovědět
```

Tento soubor aktualizuj po každé větší dokončené části práce, ne jen na konci.

---

## Co NENÍ součástí této fáze (jen pro přehled, nestavět teď)

- sekce s příběhy a texty kroniky
- chat mezi uživateli
- reálný AR obsah (stačí připravit datové pole, funkčnost počká)
- pokročilá administrace uživatelů (stačí základní role)
- vizuální styl/branding na úrovni hotového designu — zatím funkčnost nad
  jednoduchým, čistým vzhledem

---

## Poznámka k postupu práce

Než se pustíš do rozsáhlé implementace, navrhni stručně strukturu projektu (adresáře,
základní schéma databáze) a postupuj po menších, ověřitelných krocích — po každém
kroku aktualizuj `PROJECT.md`. Pokud narazíš na rozhodnutí, které výrazně ovlivní další
vývoj (např. volba auth řešení, struktura datového modelu), napiš ho do PROJECT.md
včetně zdůvodnění, i když se neptáš autorky přímo.
