-- Skrytokraj — migrace: pole "hint" (nápověda k nalezení) u bodu.
ALTER TABLE "map_points" ADD COLUMN "hint" TEXT;
