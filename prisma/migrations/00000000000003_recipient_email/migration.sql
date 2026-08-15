-- Skrytokraj — migrace: pozvánka soukromého bodu na e-mail (příjemce bez účtu).
ALTER TABLE "map_points" ADD COLUMN "recipientEmail" TEXT;

-- CreateIndex
CREATE INDEX "map_points_recipientEmail_idx" ON "map_points"("recipientEmail");
