# Nasazení Skrytokraje na server

Skrytokraj běží jako Docker sestava **app (Next.js) + PostgreSQL/PostGIS**. HTTPS a
subdoménu obstarává **systémový nginx na hostu** (reverse proxy). App poslouchá jen
na `127.0.0.1:3003` — ven vystavená není. Kód se na server dostává přes git.

> Konkrétní hodnoty pro náš server (IP, subdoména, sousední projekty) drž mimo tento
> veřejný repozitář — máš je v `.env` na serveru a ve svých poznámkách.

---

## Bezpečnostní princip (ať se neopakuje chyba z minula)
- App je navázaná na **`127.0.0.1:3003`** (localhost), NE na `0.0.0.0`.
- **Do ufw port 3003 NEpřidávej.** Otevřené ven zůstávají jen **80, 443** (nginx)
  a **SSH**.
- Databáze nemá v compose žádný `ports:` — je jen na interní Docker síti, z hostu
  ani zvenčí ji nevidíš.

---

## 1. Subdoména a DNS
1. Vyber subdoménu (např. `skrytokraj.tvojedomena.eu`). Doména může mít hlavní web
   klidně na jiném serveru — subdoména je nezávislý DNS záznam.
2. U registrátora/DNS přidej **A záznam**: `skrytokraj` → **IP tvého serveru**.
3. Ověř (počkej na rozšíření DNS): `nslookup skrytokraj.tvojedomena.eu`.

> Skrytokraj má přihlašování a hesla → jedeme rovnou přes doménu + HTTPS
> (variantu „přes IP bez HTTPS" tu vědomě NEpoužíváme, hesla by létala čitelně).

---

## 2. Kód na serveru
Poprvé (do adresáře, kde máš projekty, např. `/opt`):
```bash
cd /opt
git clone https://github.com/daasadr/skrytokraj.git
cd skrytokraj
```
Pokud tam adresář už je z dřívějška, jen aktualizuj: `cd /opt/skrytokraj && git pull`.

---

## 3. Konfigurace (.env na serveru)
```bash
cp .env.production.example .env
nano .env
```
Vyplň (soubor `.env` se **necommituje**):
- `DOMAIN` = tvoje subdoména (bez `https://`)
- `APP_PORT` = `3003` (nebo jiný volný localhost port)
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
Ověření, že app běží (na serveru):
```bash
docker ps --format 'table {{.Names}}\t{{.Ports}}'
curl -I http://127.0.0.1:3003        # očekávej HTTP 200 nebo 307
```

---

## 5. nginx subdoména + HTTPS
> Pokud reverse proxy / HTTPS spravuje jiné (serverové) okno nebo osoba, tento krok
> přeskoč — jen jim nahlas port `127.0.0.1:3003` a subdoménu.

Jinak ručně na hostu:
```bash
sudo cp deploy/nginx.skrytokraj.conf.example /etc/nginx/sites-available/skrytokraj
sudo nano /etc/nginx/sites-available/skrytokraj      # nahraď subdoménu (2×)
sudo ln -s /etc/nginx/sites-available/skrytokraj /etc/nginx/sites-enabled/skrytokraj
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d skrytokraj.tvojedomena.eu
```
Certbot sám doplní `listen 443` + certifikát a přesměruje HTTP→HTTPS. Pak otevři
`https://skrytokraj.tvojedomena.eu`, přihlas se jako admin a jsi v Mapě Skrytokraje.

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
- **Certbot selhal** → DNS A záznam ještě nemíří na server, nebo port 80 blokuje
  firewall. Ověř `nslookup` a `sudo ufw status`.
- **App se restartuje / chyba DB** → `logs -f app` (migrace čekají na DB 10×3 s),
  zkontroluj heslo v `.env`.
- **Mapa šedá** → bez MapTiler klíče jede OpenFreeMap; ověř konektivitu serveru.
