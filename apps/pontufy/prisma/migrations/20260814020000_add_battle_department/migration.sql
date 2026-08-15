-- TAREFA 13 — Batalhas de Conhecimento + departamento para ranking
-- AlterTable
ALTER TABLE "User" ADD COLUMN "department" TEXT;

-- CreateTable
CREATE TABLE "Battle" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "challengerId" TEXT NOT NULL,
    "opponentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "questionsJson" TEXT NOT NULL,
    "challengerScore" INTEGER NOT NULL DEFAULT 0,
    "opponentScore" INTEGER NOT NULL DEFAULT 0,
    "challengerElapsed" INTEGER,
    "opponentElapsed" INTEGER,
    "forfeitedBy" TEXT,
    "winnerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Battle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Battle_tenantId_status_idx" ON "Battle"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Battle_challengerId_idx" ON "Battle"("challengerId");

-- CreateIndex
CREATE INDEX "Battle_opponentId_idx" ON "Battle"("opponentId");

-- AddForeignKey
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_challengerId_fkey" FOREIGN KEY ("challengerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_opponentId_fkey" FOREIGN KEY ("opponentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;