# Nasazení Skrytokraje na server 43 (handmade-production)

Skrytokraj běží jako Docker sestava **app (Next.js) + PostgreSQL/PostGIS**. HTTPS a
subdoménu obstarává **systémový nginx na hostu** (stejně jako u projektu
`almostthere`). App poslouchá jen na `127.0.0.1:3003` — ven vystavená není.

Kód se na server dostává přes git. Server IP: `46.224.46.43`. Projekty jsou v `/opt`.

---

## Bezpečnostní princip (ať se neopakuje chyba z minula)
- App je navázaná na **`127.0.0.1:3003`** (localhost), NE na `0.0.0.0`.
- **Do ufw port 3003 NEpřidávej.** Otevřené ven zůstávají jen **80, 443** (nginx)
  a **SSH**.
- Databáze nemá v compose žádný `ports:` — je jen na interní Docker síti, z hostu
  ani zvenčí ji nevidíš.

---

## 1. Subdoména a DNS
1. Vyber subdoménu, např. `skrytokraj.tvojedomena.cz` (doména může mít hlavní web
   klidně na jiném serveru — subdoména je nezávislý DNS záznam).
2. U registrátora/DNS přidej **A záznam**: `skrytokraj` → **46.224.46.43**.
3. Ověř (počkej na rozšíření DNS): `nslookup skrytokraj.tvojedomena.cz` → 46.224.46.43.

> Skrytokraj má přihlašování a hesla → jedeme rovnou přes doménu + HTTPS
> (variantu „přes IP bez HTTPS" jako u almostthere demo tu vědomě NEpoužíváme).

---

## 2. Naklonování kódu (poprvé)
```bash
cd /opt
git clone https://github.com/daasadr/skrytokraj.git
cd skrytokraj
```
(Při dalších aktualizacích už jen `git pull` — viz sekce 6.)

---

## 3. Konfigurace (.env na serveru)
```bash
cp .env.production.example .env
nano .env
```
Vyplň (soubor `.env` se **necommituje**):
- `DOMAIN` = `skrytokraj.tvojedomena.cz`
- `APP_PORT` = `3003`
- `POSTGRES_PASSWORD` = `openssl rand -base64 24`
- `AUTH_SECRET` = `openssl rand -base64 32`
- `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` = přihlášení prvního admina (vyber si)
- `NEXT_PUBLIC_MAPTILER_KEY` = nech prázdné (OpenFreeMap), nebo doplň klíč z MapTiler

---

## 4. Spuštění appky (Docker)
```bash
docker compose -f compose.prod.yml up -d --build
```
Postaví image, nastartuje DB, aplikuje migrace, naseeduje admina + ukázkové body,
spustí app na `127.0.0.1:3003`. Sleduj průběh:
```bash
docker compose -f compose.prod.yml logs -f app
```
Rychlé ověření, že app běží (na serveru):
```bash
curl -I http://127.0.0.1:3003        # očekávej HTTP 200/307
```

---

## 5. nginx subdoména + HTTPS
```bash
# uprav subdoménu v souboru (2×), port 3003 už sedí
sudo cp deploy/nginx.skrytokraj.conf.example /etc/nginx/sites-available/skrytokraj
sudo nano /etc/nginx/sites-available/skrytokraj      # nahraď skrytokraj.tvojedomena.cz
sudo ln -s /etc/nginx/sites-available/skrytokraj /etc/nginx/sites-enabled/skrytokraj
sudo nginx -t && sudo systemctl reload nginx

# certifikát Let's Encrypt (certbot je na serveru už z předchozích projektů)
sudo certbot --nginx -d skrytokraj.tvojedomena.cz
```
Certbot sám doplní `listen 443` + certifikát a přesměruje HTTP→HTTPS. Pak otevři
`https://skrytokraj.tvojedomena.cz`, přihlas se jako admin a jsi v Mapě Skrytokraje.

> **Změň si heslo** admina po prvním přihlášení není zatím v UI — heslo z `.env`
> je platné; opětovný seed ho nepřepisuje. (Reset hesla doděláme, až bude potřeba.)

---

## 6. Aktualizace (nová verze)
Na svém počítači commitni a pushni na GitHub. Pak na serveru:
```bash
cd /opt/skrytokraj
git pull
docker compose -f compose.prod.yml up -d --build
```
Migrace se aplikují automaticky při startu.

---

## 7. MapTiler klíč (kdykoli později)
1. Registrace na https://cloud.maptiler.com/ (projde i se seznam.cz).
2. V nastavení klíče přidej subdoménu do „Allowed origins".
3. Do `.env`: `NEXT_PUBLIC_MAPTILER_KEY="..."` a **rebuild** (klíč se zapéká při buildu):
   ```bash
   docker compose -f compose.prod.yml up -d --build
   ```

---

## 8. Užitečné příkazy
```bash
docker compose -f compose.prod.yml ps                 # stav
docker compose -f compose.prod.yml logs -f app        # logy app
docker compose -f compose.prod.yml restart app        # restart app
docker compose -f compose.prod.yml down               # zastavit vše
# záloha DB:
docker compose -f compose.prod.yml exec db pg_dump -U skrytokraj skrytokraj > zaloha.sql
```

---

## 9. Řešení potíží
- **502 Bad Gateway** → app neběží nebo špatný port. Ověř `curl -I http://127.0.0.1:3003`
  a `docker compose -f compose.prod.yml logs -f app`.
- **Certbot selhal** → DNS A záznam ještě nemíří na 46.224.46.43, nebo port 80 blokuje
  firewall. Ověř `nslookup` a `sudo ufw status`.
- **App se restartuje / chyba DB** → `logs -f app` (migrace čekají na DB 10×3 s),
  zkontroluj heslo v `.env`.
- **Mapa šedá** → bez MapTiler klíče jede OpenFreeMap; ověř konektivitu serveru.
