#!/bin/sh
# Skrytokraj — start produkčního kontejneru.
# 1) počká na databázi, 2) aplikuje migrace, 3) (volitelně) naseeduje,
# 4) spustí server (CMD).
set -e

echo "→ Čekám na databázi…"
# Prisma migrate deploy si samo poradí s dostupností, ale dáme mu pár pokusů.
ATTEMPTS=0
until npx prisma migrate deploy; do
  ATTEMPTS=$((ATTEMPTS + 1))
  if [ "$ATTEMPTS" -ge 10 ]; then
    echo "✗ Databáze nedostupná po 10 pokusech, končím."
    exit 1
  fi
  echo "  …databáze ještě není připravená, zkusím znovu za 3 s (pokus $ATTEMPTS/10)"
  sleep 3
done
echo "✓ Migrace hotové."

if [ "${SEED_ON_START:-true}" = "true" ]; then
  echo "→ Seed (idempotentní: admin + ukázkové body)…"
  npm run db:seed || echo "⚠ Seed selhal (pokračuji dál)."
fi

echo "→ Spouštím aplikaci…"
exec "$@"
