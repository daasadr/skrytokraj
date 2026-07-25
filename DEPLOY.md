# Nasazení Skrytokraje na server

Postup pro nasazení na tvůj VPS (Hetzner) přes git. Deploy je Docker sestava:
**app (Next.js) + PostgreSQL/PostGIS + Caddy** (reverzní proxy s automatickým HTTPS).

Kód se na server dostává přes `git pull`, image se builduje přímo na serveru.

---

## 0. Co je potřeba na serveru (jednorázově)

Přihlas se na server přes SSH a ověř / doinstaluj:

```bash
# Docker + Docker Compose plugin
docker --version
docker compose version
```

Pokud Docker chybí, nainstaluj ho (Ubuntu/Debian):
```bash
curl -fsSL https://get.docker.com | sh
```

Otevři porty **80** a **443** (Caddy potřebuje oba kvůli HTTPS certifikátu). U
Hetzner Cloud to nastav ve **Firewall** v konzoli, na serveru případně:
```bash
ufw allow 80
ufw allow 443
ufw allow OpenSSH   # ať se neodřízneš od SSH
```

---

## 1. Doména a DNS (uděláme spolu)

Pro HTTPS potřebuješ doménu. Kroky:

1. **Zaregistruj doménu** — např. `skrytokraj.cz` u českého registrátora (Wedos,
   Forpsi), nebo levnější `.xyz`/`.eu` kdekoli. Stačí základní doména.
2. **Nasměruj ji na server** — v DNS registrátora přidej **A záznam**:
   - jméno: `@`  →  hodnota: **IPv4 adresa tvého serveru**
   - (volitelně jméno `www` → stejná IP)
3. Chvíli počkej, než se DNS rozšíří (typicky minuty až hodiny). Ověř:
   ```bash
   nslookup skrytokraj.cz
   ```
   Musí vracet IP tvého serveru.

> **Tip — test bez domény:** než doména naběhne, můžeš appku vyzkoušet i přes IP.
> V `.env` (krok 3) dočasně nastav `DOMAIN="<IP-serveru>"` — Caddy pak pojede na
> `http://<IP>` bez HTTPS. Až bude doména hotová, vrať `DOMAIN` na doménu a znovu
> `docker compose -f compose.prod.yml up -d`.

---

## 2. Stažení kódu na server

```bash
git clone https://github.com/daasadr/skrytokraj.git
cd skrytokraj
```

(Při dalších nasazeních už jen `git pull` — viz krok 6.)

---

## 3. Konfigurace (soubor .env na serveru)

```bash
cp .env.production.example .env
nano .env
```

Vyplň (soubor `.env` se **necommituje**):
- `DOMAIN` — tvoje doména (nebo dočasně IP serveru)
- `POSTGRES_PASSWORD` — silné heslo, vygeneruj: `openssl rand -base64 24`
- `AUTH_SECRET` — vygeneruj: `openssl rand -base64 32`
- `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` — přihlašovací údaje prvního admina
- `NEXT_PUBLIC_MAPTILER_KEY` — nech prázdné (mapa pojede na OpenFreeMap), nebo
  doplň klíč z MapTiler pro hezčí outdoor styl

---

## 4. První spuštění

```bash
docker compose -f compose.prod.yml up -d --build
```

Co se stane: postaví se image, nastartuje databáze, aplikují se migrace (vytvoří
tabulky), naseeduje se admin + ukázkové body, spustí se app a Caddy vyřídí HTTPS.

Sleduj průběh:
```bash
docker compose -f compose.prod.yml logs -f app
docker compose -f compose.prod.yml logs -f caddy
```

Pak otevři `https://tvoje-domena` — měl by naběhnout Skrytokraj. Přihlas se údaji
admina z `.env`.

> **Změň si heslo admina** — seed vytvoří admina s heslem z `.env`. Heslo v `.env`
> pak zůstává jen jako „obnovovací"; opětovné spuštění seedu heslo existujícího
> admina nepřepisuje.

---

## 5. MapTiler klíč (kdykoli později)

1. Zaregistruj se na https://cloud.maptiler.com/ (projde i se seznam.cz e-mailem).
2. Zkopíruj svůj **API key**, v nastavení klíče přidej svou doménu do „Allowed origins".
3. Na serveru do `.env`: `NEXT_PUBLIC_MAPTILER_KEY="tvuj-klic"`
4. **Rebuild** (klíč se zapéká při buildu):
   ```bash
   docker compose -f compose.prod.yml up -d --build
   ```

---

## 6. Aktualizace (nová verze kódu)

Na svém počítači commitni a pushni na GitHub. Pak na serveru:
```bash
cd skrytokraj
git pull
docker compose -f compose.prod.yml up -d --build
```
Migrace se aplikují automaticky při startu.

---

## 7. Užitečné příkazy

```bash
# stav kontejnerů
docker compose -f compose.prod.yml ps
# logy
docker compose -f compose.prod.yml logs -f app
# restart jen app
docker compose -f compose.prod.yml restart app
# zastavit vše
docker compose -f compose.prod.yml down
# záloha databáze
docker compose -f compose.prod.yml exec db pg_dump -U skrytokraj skrytokraj > zaloha.sql
```

---

## 8. Řešení potíží

- **HTTPS certifikát nenaběhl** → zkontroluj, že DNS A záznam míří na server a že
  jsou otevřené porty 80 a 443. Podívej se do `logs -f caddy`.
- **App se restartuje / chyba DB** → `logs -f app`. Migrace čekají na DB až 10×3 s;
  když DB nenaběhne, zkontroluj `logs -f db` a heslo v `.env`.
- **Mapa je prázdná/šedá** → bez MapTiler klíče jede OpenFreeMap; ověř připojení
  serveru k internetu. S klíčem zkontroluj „Allowed origins" v MapTiler.
- **Zapomenuté heslo admina** → dočasně nastav v `.env` nové `SEED_ADMIN_PASSWORD`
  a smaž admina z DB, nebo mi napiš — připravíme skript na reset hesla.
