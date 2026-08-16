-- Skrytokraj — migrace: nahlašování nevhodného obsahu + blokace uživatele.

-- Blokace uživatele (nepřihlásí se)
ALTER TABLE "users" ADD COLUMN "isBlocked" BOOLEAN NOT NULL DEFAULT false;

-- Stav nahlášení
CREATE TYPE "ReportStatus" AS ENUM ('open', 'resolved', 'dismissed');

-- Nahlášení
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "pointId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reports_status_idx" ON "reports"("status");

-- CreateIndex
CREATE INDEX "reports_pointId_idx" ON "reports"("pointId");

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_pointId_fkey" FOREIGN KEY ("pointId") REFERENCES "map_points"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
