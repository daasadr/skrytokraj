# Skrytokraj

Lokální hra typu geocaching s příběhovým a fantasy přesahem, zasazená do okolí
Petřvaldu na Novojičínsku. Web (PWA) s **Mapou Skrytokraje** — mapa s živou polohou,
body zájmu (úkoly, poklady, příběhová a AR místa, schránky se vzkazy).

Podrobný přehled stavu, rozhodnutí a dalších kroků je v **[PROJECT.md](./PROJECT.md)**.
Mytologie a příběhy jsou v **[Kronika_skryteho_kraje.md](./Kronika_skryteho_kraje.md)**.

## Tech stack
Next.js 16 (App Router, TypeScript) · Tailwind v4 · Prisma 7 · PostgreSQL + PostGIS ·
Auth.js (NextAuth v5) · MapLibre (react-map-gl v8) · PWA · Docker.

Nasazení na server: viz **[DEPLOY.md](./DEPLOY.md)**.

## Jak spustit (lokální vývoj)

### 0. Předpoklady
- Node.js 22+ (máš), npm
- **Docker Desktop** (na stroji zatím není nainstalovaný — potřeba doinstalovat
  kvůli databázi), nebo vlastní PostgreSQL s rozšířením PostGIS.

### 1. Konfigurace
Zkopíruj vzor a doplň hodnoty:
```bash
cp .env.example .env
```
V `.env` je už předvyplněná `DATABASE_URL` (pro Docker) a vygenerovaný `AUTH_SECRET`.
Mapa funguje i **bez klíče** (podklad OpenFreeMap). Volitelně doplň
`NEXT_PUBLIC_MAPTILER_KEY` (klíč zdarma z https://cloud.maptiler.com/) pro hezčí
outdoor styl.

### 2. Databáze
```bash
docker compose up -d db      # nastartuje PostgreSQL + PostGIS
npm install                  # (pokud ještě neproběhlo) — spustí i prisma generate
npm run db:migrate           # vytvoří tabulky (nebo: npx prisma migrate deploy)
npm run db:seed              # založí admina + ukázkové body z Kroniky
```
Přihlašovací údaje admina (lze změnit přes `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`):
- e-mail: `admin@skrytokraj.cz`
- heslo: `skrytokraj-admin`

### 3. Spuštění appky
```bash
npm run dev
```
Aplikace poběží na http://localhost:3000.

## Užitečné příkazy
| Příkaz | Co dělá |
| --- | --- |
| `npm run dev` | vývojový server |
| `npm run build` / `npm start` | produkční build / spuštění |
| `npm run db:migrate` | vytvoří/aplikuje migraci |
| `npm run db:push` | prosadí schéma bez migrace |
| `npm run db:seed` | naplní ukázková data |
| `npm run db:studio` | Prisma Studio (prohlížeč DB) |

## Role a oprávnění
- **admin** — zakládá/edituje/maže na mapě úkoly, poklady, příběhová a AR místa;
  smí upravovat/mazat libovolný bod.
- **user** — zakládá schránky se vzkazem (viditelné buď veřejně všem, nebo jen
  konkrétnímu vybranému uživateli); smí mazat/upravovat vlastní schránky.

## Struktura projektu (výběr)
```
app/                    # Next.js App Router
  page.tsx              # úvodní stránka
  prihlaseni/ registrace/ kronika/   # přihlášení, registrace, placeholder Kronika
  mapa/                 # Mapa Skrytokraje (chráněná)
  api/points/ api/users/            # REST API pro body a uživatele
  manifest.ts           # PWA manifest
auth.ts                 # konfigurace Auth.js
proxy.ts                # ochrana rout (Next 16 „middleware")
components/             # SiteHeader, auth formuláře, mapové komponenty
lib/                    # prisma klient, dotazy, validace, metadata bodů
prisma/                 # schema, migrace, seed
docker-compose.yml Dockerfile        # lokální vývoj / kontejnerizace
```

## Nasazení
Struktura odpovídá nasazení do Docker kontejneru (Hetzner VPS). Ostrá deployment
konfigurace není součástí fáze 1 — `Dockerfile` a `docker compose --profile full up`
jsou připravené jako základ.
