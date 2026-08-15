# Skrytokraj — kompletní přehled projektu

> Živý dokument. Aktualizuje se po každé větší dokončené části. Slouží nám oběma jako
> jedno místo, kam se kdykoli podíváme na stav, technická rozhodnutí a plány.
> Poslední aktualizace: **2026-08-02**.

---

## 1. O projektu
Skrytokraj je **lokální hra typu geocaching s příběhovým a fantasy přesahem**, zasazená
do okolí Petřvaldu na Novojičínsku (řeka Lubina, Poodří; obce Trnávka, Skotnice, Stará
Ves nad Ondřejnicí, Petřvaldík a další). Hráči v reálné krajině hledají fyzická i AR
místa, plní úkoly, hledají poklady a schránky se vzkazy a postupně odhalují mytologii
kraje (**Kronika skrytého kraje**).

Web je stavěný jako **PWA** — funguje na mobilu a jde přidat na plochu telefonu. Kraj
se bude rozšiřovat po vesnicích; každá může dostat vlastní příběh napojený na skutečné
místo, pověst nebo historickou událost.

Zdroje příběhu: `Kronika_skryteho_kraje.md`. Zadání 1. fáze: `ZADANI_SKRYTOKRAJ_faze1.md`.

## 2. Slovníček Kroniky (aby technika seděla s příběhem)
- **Vrstvy** — svět má víc vrstev položených přes sebe; kdysi mezi nimi nebyly zdi.
- **Propojení → Probuzení → Mlčení → Návrat** — kosmologie kraje (éry). Dnes je Návrat.
- **Skulina** — místo, kde je vrstva nejtenčí (cíl hledání). Odtud i ikona/logo appky.
- **Naslouchání** — schopnost všímat si; „mechanika" řešení úkolů (pozornost, ne síla).
- **Kronikáři** — hráči, kteří zaznamenávají, co najdou. Role `user` = kronikář.
- Příběhové linky: Skrytci z Hončovy hůrky, Páví strážci Petřvaldu, Švejťák (Stará Ves),
  Paní mlh z Poodří, Harty (zaniklá vesnice), Hraniční strom v Trnávce.

## 3. Architektura ve zkratce
Jedna **Next.js 16** aplikace (App Router) obsluhuje **frontend, API i autentizaci**
v jednom procesu (monolit, jeden port). Data drží **PostgreSQL + PostGIS** přes ORM
**Prisma 7**. Mapu vykresluje **MapLibre** (v prohlížeči). V produkci vše běží v Dockeru
za systémovým **nginx** (HTTPS). Zjednodušeně:

```
Prohlížeč (PWA)
   │  https
   ▼
nginx (host, TLS) ── reverse proxy ──►  Next.js app (Docker, 127.0.0.1:3003)
                                            │  ├─ stránky (React Server Components)
                                            │  ├─ /api/*  (route handlery)
                                            │  └─ Auth.js (JWT session)
                                            ▼
                                    PostgreSQL + PostGIS (Docker, interní síť)
```

## 4. Tech stack a proč
| Vrstva | Volba | Proč |
| --- | --- | --- |
| Framework | **Next.js 16** (App Router, TS), React 19 | jeden nástroj na frontend i API, SSR, PWA |
| Styl | **Tailwind CSS v4** | rychlé, konzistentní UI; konfigurace v CSS |
| Databáze | **PostgreSQL + PostGIS** | robustní; PostGIS připraven na prostorové dotazy |
| ORM | **Prisma 7** | typované dotazy, migrace; nový generátor + pg adapter |
| Auth | **Auth.js (NextAuth v5)** | email/heslo, JWT, role; bez cizích služeb |
| Mapa | **MapLibre** (react-map-gl v8) | open-source; Mapbox odmítl registraci (viz §11) |
| Podklad | **MapTiler** / **OpenFreeMap** | outdoor styl s klíčem; bez klíče zdarma fallback |
| PWA | `app/manifest.ts` + `public/sw.js` | instalace na plochu telefonu |
| Běh | **Docker + docker compose** | izolace, snadné nasazení, shoda s ostatními projekty |

## 5. Datový model
Dvě tabulky (`prisma/schema.prisma`):

**User** — `id`, `email` (unikátní), `name`, `passwordHash` (bcrypt), `role`
(`admin` | `user`), `createdAt`.

**MapPoint** — jeden bod na mapě, sdílený základ pro všechny typy:
- `type`: `quest` | `treasure` | `story_location` | `ar_location` | `message_box`
- `name`, `description` (příběh), `hint` (nápověda k nalezení — odděleně)
- `lat`, `lng` (Float; souřadnice WGS84)
- `visibility`: `public` | `private_user` (u sdílitelných typů — schránka, poklad)
- `recipientId` (nullable) — komu je soukromě sdíleno
- `createdById` — autor
- `arContent` (nullable) — placeholder pro budoucí AR obsah
- `isActive` — deaktivace bez mazání
- `createdAt`, `updatedAt`

Proč jedna tabulka místo oddělené `MessageBox` — viz §12.

## 6. Autentizace a role
- Přihlášení **email + heslo** (Credentials), hesla hashovaná `bcrypt`.
- **JWT session** — `id` a `role` neseme v tokenu i session (typy v
  `types/next-auth.d.ts`).
- **Role:**
  - `admin` — zakládá/edituje/maže úkoly, příběhová a AR místa; smí upravovat a mazat
    libovolný bod.
  - `user` (kronikář) — zakládá **schránky se vzkazem a poklady** (sdílitelné typy):
    veřejně, nebo jen konkrétnímu uživateli; smí mazat/upravovat vlastní body.
  - „Sdílitelné" typy (schránka, poklad) mají volbu viditelnosti; úkoly/příběhy/AR
    (adminské) jsou vždy veřejné. Řízeno přes `MAP_POINT_TYPES.shareable`/`adminOnly`.
- **Ochrana rout:** `proxy.ts` (v Next 16 nástupce `middleware.ts`) přesměruje
  nepřihlášené z `/mapa` na `/prihlaseni`.
- Registrace je zatím **volná a veřejná** (nová role `user`) — otevřená otázka §13.

## 7. Mapa Skrytokraje (hlavní funkce)
- **Živá poloha** hráče přes geolokaci prohlížeče (`GeolocateControl`).
- **Body podle typu** — odlišené ikonou a barvou (viz `lib/mapPoints.ts`), po kliknutí
  detail v popupu (název, popis, typ, autor).
- **Viditelnost dotazu** — hráč vidí veřejné body, soukromé určené jemu a vlastní
  (`lib/points.ts` → `getVisiblePoints`).
- **Zakládání bodů:**
  - kdokoli: „Přidat schránku se vzkazem" → umístění klepnutím do mapy nebo dle polohy →
    text + viditelnost (veřejně / konkrétnímu uživateli ze seznamu)
  - admin: „Přidat místo" s výběrem typu (úkol/poklad/příběhové/AR)
- **Podklad** se volí automaticky (`lib/mapStyle.ts`): MapTiler outdoor když je klíč,
  jinak OpenFreeMap. Mapa se načítá dynamicky bez SSR (MapLibre potřebuje `window`).

## 8. Přehled API (route handlery)
- `GET /api/points` — body viditelné pro přihlášeného uživatele
- `POST /api/points` — založení bodu (kontrola oprávnění dle typu)
- `PATCH /api/points/[id]` — úprava (admin cokoliv; autor vlastní schránku)
- `DELETE /api/points/[id]` — smazání (stejná pravidla)
- `GET /api/users` — seznam uživatelů (id + jméno) pro výběr příjemce
- `/api/auth/[...nextauth]` — Auth.js (přihlášení, odhlášení, session)

## 9. Adresářová struktura (výběr)
```
app/
  page.tsx              úvod
  prihlaseni/ registrace/ kronika/   přihlášení, registrace, placeholder Kronika
  mapa/                 Mapa Skrytokraje (chráněná)
  api/points/ api/users/            REST API
  manifest.ts           PWA manifest
auth.ts  proxy.ts       Auth.js + ochrana rout
components/             SiteHeader, auth formuláře, map/ (MapView, PointForm, …)
lib/                    prisma, points, validation, mapPoints, mapStyle, actions/
prisma/                 schema, migrations, seed.ts
deploy/                 nginx.skrytokraj.conf.example
Dockerfile  docker-entrypoint.sh  compose.prod.yml  Caddyfile
```

## 10. Proměnné prostředí
| Proměnná | K čemu | Pozn. |
| --- | --- | --- |
| `DATABASE_URL` | připojení k DB | v produkci sestaví compose |
| `AUTH_SECRET` | šifrování session | `openssl rand -base64 32` |
| `AUTH_URL` | veřejná URL pro Auth.js | `https://<subdoména>` |
| `AUTH_TRUST_HOST` | důvěra proxy | `true` |
| `NEXT_PUBLIC_MAPTILER_KEY` | podklad MapTiler | **nepovinné**; bez něj OpenFreeMap |
| `RESEND_API_KEY` | pozvánky e-mailem | **nepovinné**; bez něj se e-mail neodešle |
| `EMAIL_FROM` | odesílatel pozvánek | po ověření domény v Resend |
| `POSTGRES_*` | jméno/heslo/db | jen produkční compose |
| `SEED_ADMIN_*` | první admin | naseeduje se při startu |

Vzory: `.env.example` (lokál), `.env.production.example` (server). `.env` se necommituje.

## 11. Nasazení
- **Tok:** kód → GitHub (`daasadr/skrytokraj`) → server přes `git pull`.
- **Produkce:** `compose.prod.yml` staví app + PostGIS. App poslouchá **jen na
  localhost** (`127.0.0.1:<port>`), databáze je **jen na interní Docker síti**
  (nikam se nepublikuje). HTTPS a subdoménu řeší **systémový nginx na hostu** (mimo
  tento repozitář). Migrace a seed běží při startu (`docker-entrypoint.sh`).
- **Bezpečnost:** app navázaná na `127.0.0.1`, ven otevřené jen 80/443 (nginx) a SSH;
  port appky se do ufw NEpřidává.
- **Lokální databáze se nepoužívá** — vývoj i běh míří na server.
- Podrobný postup: `DEPLOY.md`. (Konkrétní IP/subdoménu/sousední projekty držíme mimo
  veřejný repozitář.)

## 12. Technická rozhodnutí (a proč)
- **Jedna tabulka `MapPoint`** místo oddělené `MessageBox` — společný základ, jednodušší
  dotaz na viditelnost; oddělit lze později, kdyby schránky nabraly vlastní logiku.
- **Souřadnice jako Float** (ne PostGIS geometry) — Prisma nemá dobrou nativní podporu
  geometry a ve fázi 1 nepotřebujeme prostorové dotazy. PostGIS je ale zapnutý; „body
  v okolí" se doplní později přes raw SQL (`geometry(Point,4326)` + GIST index).
- **MapLibre místo Mapboxu** (2026-07-25) — Mapbox odmítá registraci s osobním e-mailem.
  MapLibre je open-source dvojče; podklad MapTiler (klíč projde i se seznam.cz) nebo
  OpenFreeMap (bez klíče). Mapa funguje hned.
- **JWT session bez Prisma adaptéru** — pro email/heslo s rolemi stačí; méně vazeb.
- **Prisma 7 nucené změny** — runtime bez Rust enginu → nutný driver adapter
  (`@prisma/adapter-pg`); connection URL v `prisma.config.ts`, ne ve schématu; nový
  generátor `prisma-client` (generuje TS klienta do `generated/`, proto `postinstall`).
- **Next.js 16 novinky** — `params`/`searchParams`/`cookies()`/`headers()` jsou async;
  `middleware.ts` → `proxy.ts`; Turbopack default; `next lint` odstraněn.
- **Nasazení bez Caddyho v compose** — na cílovém serveru už drží 80/443 systémový
  nginx; vlastní proxy by kolidovala. App se proto jen vystaví na localhost port.
- **maplibre-gl přišpendlen na v5** (2026-08-04) — react-map-gl v8 má peer
  `maplibre-gl >=4.0.0`, ale s úplně novou **v6 se rozbíjí** (chyba `reading 'center'`
  v kameře, padající worker → šedá mapa). Pin `^5.24.0`. Pozor na to při updatech.

## 13. Otevřené otázky pro autorku
- **Registrace:** volná veřejná, nebo jen na pozvání/schválení adminem? (Zatím volná.)
- **Reset/změna hesla admina** v UI zatím není — doděláme, až bude potřeba.
- **MapTiler klíč** — chceš hezčí outdoor styl? Pak si založit klíč a vložit do `.env`
  (jinak OpenFreeMap stačí).

## 14. Stav

### Hotovo
- Kostra webu (Next.js 16, TS, Tailwind v4), PWA (manifest, ikony, service worker).
- Auth.js: přihlášení, registrace, odhlášení, role, ochrana rout.
- Prisma 7 + PostgreSQL/PostGIS: schéma, migrace (vč. PostGIS), seed (admin + body).
- Mapa Skrytokraje: MapLibre, geolokace, body dle typu, detail, admin CRUD,
  uživatelské schránky s viditelností public/private.
- REST API pro body a uživatele s kontrolou oprávnění.
- Produkční nasazení: Dockerfile, `compose.prod.yml`, entrypoint (migrace+seed),
  `deploy/nginx.*` vzor, `DEPLOY.md`. Kód na GitHubu.
- Dokončení fáze 1: rastrové PWA ikony (192/512, maskable, apple-touch), skládací
  mobilní menu (hamburger), přesun bodu tažením markeru, vycentrování mapy na polohu
  hráče při načtení (podpora více oblastí).
- Admin sekce `/admin`: správa uživatelů (změna rolí), správa **Oblastí (krajů)** —
  zakládání/editace/mazání s úvodem příběhu, středem, stylem a zveřejněním.
- Model **Region** + `regionId` na bodu (migrace `00000000000001_regions`).
- **Offline PWA:** service worker cachuje app shell (otevře se offline), statické
  buildy, a **mapové dlaždice/styl podle toho, co si projdeš online** (kraj pak funguje
  offline). Poloha (GPS) funguje offline sama. Offline *zápis* bodu (fronta) a stažení
  celého kraje naráz zatím ne — viz plán.
- **Úkolová mechanika:** úkol/poklad může mít správnou odpověď/kód; hráč ji v detailu
  zadá (posuzuje se bez ohledu na velikost písmen a diakritiku), vyřešení se zaznamená
  (tabulka `point_completions`) a marker dostane ✓. Odpověď se hráčům **nikdy neposílá**
  (jen admin/autor). API `/api/points/[id]/solve`. Migrace `00000000000005_quests`.
- **Fotky u bodů** (nepovinné, všechny typy): komprese v prohlížeči (canvas) před
  uploadem, uložení na perzistentní disk (volume), galerie v detailu. Migrace
  `00000000000004_point_images`. API `/api/upload` + `/api/photos/[name]`.
- Soukromé sdílení bodu i na **e-mail** (příjemce bez účtu ho uvidí po registraci;
  s Resend přijde pozvánka) + zvýraznění „jen pro tebe" na mapě (zlatá záře + 🎁).
  Migrace `00000000000003_recipient_email`.
- Oblasti end-to-end: bod lze zařadit do oblasti; mapa má přepínač „Kraj"
  (vstup do kapitoly vycentruje mapu, ukáže úvod příběhu a jen body oblasti;
  „Všechny" = volná mapa); admin vybírá střed oblasti klepnutím do mini-mapy.
- Ověřeno: `tsc --noEmit` ✓, `next build` ✓, runtime smoke test ✓.

### Aktuální stav
- **Nasazeno a funkční na produkční subdoméně** (git → server → Docker, za hostitelským
  nginx s HTTPS). Přihlášení, mapa i podklad (MapTiler) běží. Fáze 1 je živá. 🎉

### Velké rozhodnutí k promyšlení: oblasti / kapitoly
Skrytokraj se rozšíří za Petřvald (Průhonice a dál; časem víc adminů). Dvě vize:
(A) **volná mapa** jako klasický geocaching — všechny cíle podle polohy hráče;
(B) **kapitoly po oblastech** — každá oblast má svůj příběh a styl. Nejsou to protiklady:
doporučení je přidat lehký model **Region/Oblast** (bod patří do oblasti), který umožní
oboje — výchozí je volná mapa dle polohy, a zároveň jde filtrovat/„vstoupit do kapitoly".
Rozhodnutí zatím otevřené — probrat před dalším větším krokem.

### Plán / další fáze
- **Datový model oblastí** (Region) — až se rozhodne směr (viz výše).
- **Další fáze:** sekce Kronika/příběhy (obsah), chat mezi uživateli, reálný AR obsah,
  pokročilá administrace uživatelů, prostorové dotazy „body v okolí" (PostGIS),
  reset hesla, e-mailové notifikace.
