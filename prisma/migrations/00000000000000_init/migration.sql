-- Skrytokraj — počáteční migrace (fáze 1)
-- Vygenerováno přes `prisma migrate diff` + ručně doplněná PostGIS extension.

-- PostGIS: zapneme rozšíření (image postgis/postgis ho obsahuje). Zatím ho
-- aktivně nevyužíváme (souřadnice držíme jako Float lat/lng), ale je připravené
-- pro budoucí prostorové dotazy "body v okolí". Viz PROJECT.md.
CREATE EXTENSION IF NOT EXISTS postgis;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'user');

-- CreateEnum
CREATE TYPE "MapPointType" AS ENUM ('quest', 'treasure', 'story_location', 'ar_location', 'message_box');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('public', 'private_user');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "map_points" (
    "id" TEXT NOT NULL,
    "type" "MapPointType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "visibility" "Visibility" NOT NULL DEFAULT 'public',
    "createdById" TEXT NOT NULL,
    "recipientId" TEXT,
    "arContent" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "map_points_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "map_points_type_idx" ON "map_points"("type");

-- CreateIndex
CREATE INDEX "map_points_visibility_idx" ON "map_points"("visibility");

-- CreateIndex
CREATE INDEX "map_points_recipientId_idx" ON "map_points"("recipientId");

-- AddForeignKey
ALTER TABLE "map_points" ADD CONSTRAINT "map_points_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "map_points" ADD CONSTRAINT "map_points_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
