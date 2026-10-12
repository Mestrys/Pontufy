-- TAREFA 13.2 — Departamento pré-atribuído pelo RH no convite
-- AlterTable
ALTER TABLE "Invitation" ADD COLUMN "department" TEXT;

-- Normaliza departamentos vazios gravados pelo antigo PATCH /api/users/profile
-- (string vazia criava um "departamento fantasma" no ranking).
UPDATE "User" SET "department" = NULL WHERE TRIM("department") = '';
