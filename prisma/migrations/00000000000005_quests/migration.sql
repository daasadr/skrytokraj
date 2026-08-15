-- Skrytokraj — migrace: úkolová mechanika (odpověď + dokončení úkolů).

-- Správná odpověď/kód u bodu (hráčům se neposílá)
ALTER TABLE "map_points" ADD COLUMN "answer" TEXT;

-- Kdo který bod vyřešil/našel
CREATE TABLE "point_completions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pointId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "point_completions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "point_completions_userId_pointId_key" ON "point_completions"("userId", "pointId");

-- CreateIndex
CREATE INDEX "point_completions_pointId_idx" ON "point_completions"("pointId");

-- AddForeignKey
ALTER TABLE "point_completions" ADD CONSTRAINT "point_completions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "point_completions" ADD CONSTRAINT "point_completions_pointId_fkey" FOREIGN KEY ("pointId") REFERENCES "map_points"("id") ON DELETE CASCADE ON UPDATE CASCADE;
