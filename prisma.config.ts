import "dotenv/config";
import { defineConfig } from "prisma/config";

// Prisma 7 config — connection URL pro Prisma Migrate (CLI).
// Runtime klient (lib/prisma.ts) se připojuje přes @prisma/adapter-pg.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
