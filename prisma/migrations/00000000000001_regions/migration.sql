-- Skrytokraj — migrace: Oblasti (kraje) + napojení bodů na oblast.

-- AlterTable: bod může patřit do oblasti (nepovinné)
ALTER TABLE "map_points" ADD COLUMN "regionId" TEXT;

-- CreateTable: oblasti
CREATE TABLE "regions" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "centerLat" DOUBLE PRECISION NOT NULL,
    "centerLng" DOUBLE PRECISION NOT NULL,
    "defaultZoom" DOUBLE PRECISION NOT NULL DEFAULT 13,
    "color" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "regions_slug_key" ON "regions"("slug");

-- CreateIndex
CREATE INDEX "map_points_regionId_idx" ON "map_points"("regionId");

-- AddForeignKey
ALTER TABLE "map_points" ADD CONSTRAINT "map_points_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regions" ADD CONSTRAINT "regions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
