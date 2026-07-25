# Skrytokraj — produkční image (Next.js 16).
# Používá se přes compose.prod.yml na serveru (git pull → docker compose build).
# Pro lokální vývoj tento image nepotřebuješ — stačí `npm run dev`.

FROM node:22-alpine AS base
WORKDIR /app
# libc6-compat + openssl kvůli Prisma (migrate engine na Alpine/musl)
RUN apk add --no-cache libc6-compat openssl

# --- deps: instalace závislostí (bez postinstall skriptů — schéma tu ještě není)
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# --- build: vygenerování Prisma klienta + build Next.js -----------------------
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_* proměnné se do Next.js zapékají při buildu → musí být zde.
ARG NEXT_PUBLIC_MAPTILER_KEY=""
ENV NEXT_PUBLIC_MAPTILER_KEY=$NEXT_PUBLIC_MAPTILER_KEY
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate && npm run build

# --- runtime -----------------------------------------------------------------
FROM base AS runtime
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Celý strom včetně node_modules (potřebujeme prisma CLI + tsx pro migrace a seed
# při startu, a next start). Spolehlivost před velikostí image.
COPY --from=build /app ./
COPY docker-entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["npm", "run", "start"]
