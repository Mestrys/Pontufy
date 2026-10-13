-- Migration: 20261012000000_stagger_tied_lesson_order
-- As aulas geradas por IA eram criadas na mesma transação e ficavam com o mesmo
-- "createdAt"; a ordem no player dependia da ordem física das linhas. As
-- consultas agora desempatam pelo id (aleatório), então antes disso espaçamos
-- os empates em 1 ms seguindo a ordem de inserção (ctid). Só mexe em grupos
-- empatados; aulas com createdAt único não mudam. Não altera dados de conteúdo.
WITH ranked AS (
  SELECT
    id,
    row_number() OVER (PARTITION BY "courseId", "createdAt" ORDER BY ctid) - 1 AS pos,
    count(*) OVER (PARTITION BY "courseId", "createdAt") AS tied
  FROM "Lesson"
)
UPDATE "Lesson" l
SET "createdAt" = l."createdAt" + ranked.pos * interval '1 millisecond'
FROM ranked
WHERE ranked.id = l.id
  AND ranked.tied > 1
  AND ranked.pos > 0;
