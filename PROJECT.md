# Skrytokraj — přehled projektu

## O projektu
Skrytokraj je lokální hra typu geocaching s příběhovým a fantasy přesahem, zasazená
do okolí Petřvaldu na Novojičínsku (řeka Lubina, Poodří; obce Trnávka, Skotnice,
Stará Ves nad Ondřejnicí, Petřvaldík a další). Hráči v krajině hledají fyzická i AR
místa, plní úkoly, hledají poklady a schránky se vzkazy a postupně odhalují mytologii
kraje (Kronika skrytého kraje). Web je stavěný jako PWA (funguje na mobilu, jde přidat
na plochu telefonu). Tato první fáze staví kostru webu a jednu klíčovou část —
**Mapu Skrytokraje**.

## Tech stack
- **Next.js 16** (App Router) + **TypeScript**, **React 19.2**. Pozor: Next 16 má
  proti 14/15 breaking changes (async `params`/`cookies`/`headers`, `middleware`→`proxy`,
  Turbopack default) — zohledněno v kódu.
- **Tailwind CSS v4** — konfigurace v CSS (`@import "tailwindcss"` + `@theme`).
- **PostgreSQL + PostGIS** (docker image `postgis/postgis:16-3.4`).
- **Prisma 7** jako ORM (nový generátor `prisma-client`, driver adapter `@prisma/adapter-pg`).
- **Auth.js (NextAuth v5)** — email/heslo (Credentials), JWT session, role `admin`|`user`.
- **MapLibre GL** přes **react-map-gl v8** (import z `react-map-gl/maplibre`);
  podklad MapTiler (klíč) nebo OpenFreeMap (bez klíče).
- **Docker Compose** pro lokální vývoj (PostGIS + volitelně app).
- PWA přes nativní `app/manifest.ts` + service worker (`public/sw.js`).

## Aktuální stav
**Fáze 1 je funkčně hotová.** Kostra webu stojí, Mapa Skrytokraje funguje (mapa,
geolokace, body podle typu, admin CRUD, uživatelské schránky s viditelností).
Projekt prošel `tsc --noEmit` i `next build` bez chyb a dev server běžně nastartuje
(úvod/přihlášení/kronika se vykreslují, `/mapa` chrání proxy, API vrací 401 bez
přihlášení). **Zbývá jen na straně autorky:** spustit databázi (Docker) + migraci +
seed a doplnit Mapbox token — viz „Jak spustit" v README.

## Hotovo
- [2026-07-24] Scaffold Next.js 16 + TS + Tailwind v4 (App Router).
- [2026-07-24] Prisma 7: schéma `User` + `MapPoint`, migrace vč. PostGIS extension,
  klient s pg adaptérem, seed skript (admin + ukázkové body z Kroniky).
- [2026-07-24] Auth.js: přihlášení, registrace, odhlášení, role, ochrana rout (`proxy.ts`).
- [2026-07-24] Kostra UI: layout, hlavička/menu podle přihlášení, úvod, placeholder
  sekce Kronika, PWA manifest + ikony + service worker.
- [2026-07-24] Mapa Skrytokraje: mapa (Mapbox), živá geolokace, body podle typu
  (ikona/barva), detail v popupu, admin zakládá/edituje/maže úkoly/poklady/příběhová/
  AR místa, uživatel zakládá schránky se vzkazem (veřejné / konkrétnímu uživateli).
- [2026-07-24] REST API `/api/points`, `/api/points/[id]`, `/api/users` s oprávněními.
- [2026-07-24] `docker-compose.yml`, `Dockerfile`, `.env.example`, `.env`, README.
- [2026-07-24] Ověřeno: `tsc --noEmit` ✓, `next build` ✓, runtime smoke test ✓.

## Pracuje se na
- (nic rozpracovaného) — fáze 1 uzavřena, čeká se na spuštění DB a Mapbox token.

## TODO / další kroky
### Ke spuštění (autorka)
- Nainstalovat **Docker Desktop** (na stroji zatím není), pak `docker compose up -d db`.
- `npm run db:migrate` (nebo `prisma migrate deploy`) + `npm run db:seed`.
- Doplnit **`NEXT_PUBLIC_MAPBOX_TOKEN`** do `.env` (public token `pk.…` z účtu Mapbox),
  jinak se mapa nevykreslí (zobrazí se hláška).

### Vylepšení fáze 1 (drobnosti)
- Rastrové PWA ikony 192/512 px (maskable) + apple-touch-icon PNG — teď jen SVG placeholder.
- Mobilní menu jako skládací (hamburger) místo vodorovného scrollu.
- Možnost při editaci bodu i přesunout jeho polohu (teď edituje jen text/viditelnost).

### Další fáze (mimo fázi 1)
- Sekce Kronika/příběhy (obsah), chat mezi uživateli, reálný AR obsah.
- Pokročilá administrace uživatelů.
- Prostorové dotazy „body v okolí" přes PostGIS (viz rozhodnutí níže).
- Ostrá deployment konfigurace (Hetzner VPS).

## Rozhodnutí a poznámky

### Datový model: jedna tabulka `MapPoint` (ne oddělený `MessageBox`)
Všechny typy bodů sdílí základ (souřadnice, název, popis, autor, viditelnost, čas);
liší se jen `type` a tím, kdo je smí zakládat (řešeno v oprávněních API). Jedna tabulka
s enumem `MapPointType` + `Visibility` (`public`/`private_user`) a nullable `recipientId`
dává čistší kód a jednodušší dotaz „vrať vše viditelné pro uživatele X" než dvě tabulky.
Kdyby schránky narostly o hodně vlastní logiky, lze je oddělit později.

### Souřadnice jako Float (lat/lng), PostGIS připraven na později
Prisma nemá pořádnou nativní podporu PostGIS `geometry`. Ve fázi 1 mapa jen zobrazuje
viditelné body — prostorové dotazy „v okolí" nepotřebujeme. Držíme `Float lat`/`Float lng`
(jednoduché, plně typované). DB ale běží na `postgis/postgis` a migrace zapíná extension,
takže později stačí doplnit `geometry(Point,4326)` + GIST index přes raw SQL a dotazovat
přes `prisma.$queryRaw`. Vyhneme se tření Prisma × PostGIS teď a neztrácíme budoucnost.

### Prisma 7 — dvě nucené změny oproti starším verzím
- Runtime už neobsahuje Rust engine → `PrismaClient` **vyžaduje driver adapter**
  (`@prisma/adapter-pg`), viz `lib/prisma.ts`.
- Connection URL **nepatří do `schema.prisma`**, ale do `prisma.config.ts` (Migrate);
  runtime se připojuje přes adapter. Generátor je nový `prisma-client` (generuje TS
  klienta do `generated/prisma`, proto je `postinstall: prisma generate`).

### Next.js 16 — na co dát pozor
`params`/`searchParams`/`cookies()`/`headers()` jsou async (nutné `await`);
`middleware.ts` je přejmenován na **`proxy.ts`** (funkce `proxy`, jen Node runtime);
Turbopack je default; `next lint` odstraněn.

### Auth: JWT session bez Prisma adaptéru
Credentials provider + JWT strategie, roli `role` a `id` neseme v tokenu i session
(typy rozšířeny v `types/next-auth.d.ts`). Prisma adapter (DB session/OAuth) zatím
netřeba. Hesla přes `bcryptjs`.

### Mapa: MapLibre místo Mapboxu (2026-07-25)
Mapbox **odmítá registraci s osobním e-mailem** (chce firemní/doménový), autorka se
tedy nemohla zaregistrovat. Přešli jsme na **MapLibre** (open-source, `react-map-gl`
ho podporuje přes `react-map-gl/maplibre`). Podklad: **MapTiler outdoor** když je
`NEXT_PUBLIC_MAPTILER_KEY` (registrace projde i se seznam.cz), jinak automaticky
**OpenFreeMap** (bez klíče, bez registrace) — viz `lib/mapStyle.ts`. Mapa tak funguje
hned. Komponenta se načítá dynamicky bez SSR (`ssr:false`), MapLibre potřebuje `window`.

### Nasazení: git → server → Docker (2026-07-25)
Kód jde na GitHub (`daasadr/skrytokraj`) a na server (Hetzner VPS) se dostává přes
`git pull`. Produkční sestava `compose.prod.yml`: app + PostGIS + **Caddy** (auto
HTTPS). Migrace a seed běží při startu (`docker-entrypoint.sh`). NEBUDE se používat
lokální databáze — vše běží na serveru. Postup je v `DEPLOY.md`.

### Otevřené otázky pro autorku
- **Registrace:** zatím **volná veřejná** registrace (role `user`). Má být volná, nebo
  jen na pozvání/schválení adminem?
- **Mapa:** vyřešeno — MapLibre + OpenFreeMap (funguje bez klíče). MapTiler klíč je
  jen volitelné vylepšení stylu.
- **Výchozí střed mapy:** nastaven na Petřvald (`lib/mapPoints.ts` → `DEFAULT_MAP_CENTER`).
- **Ukázkové body:** souřadnice v seedu jsou přibližné — dolaď je přímo na mapě.
