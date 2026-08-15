-- Skrytokraj — migrace: fotky u bodu (pole URL).
ALTER TABLE "map_points" ADD COLUMN "imageUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
