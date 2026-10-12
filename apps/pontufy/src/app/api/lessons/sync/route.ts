import { NextResponse } from 'next/server';
import { getSessionContext } from '@/backend/session';
import { getTenantDb } from '@/backend/db';

const MAX_ITEMS = 50;

interface SyncItem {
  lessonId: string;
  courseId?: string;
  completedAt?: string;
}

export async function POST(request: Request) {
  try {
    const { userId, tenantId } = await getSessionContext();

    const body = await request.json().catch(() => null);
    const rawItems: unknown = body?.items;

    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma conclusão para sincronizar.' },
        { status: 400 },
      );
    }

    if (rawItems.length > MAX_ITEMS) {
      return NextResponse.json(
        { error: `Limite de ${MAX_ITEMS} itens por requisição.` },
        { status: 400 },
      );
    }

    const items: SyncItem[] = [];
    for (const item of rawItems) {
      if (item && typeof item === 'object' && typeof (item as { lessonId?: unknown }).lessonId === 'string') {
        items.push({
          lessonId: (item as { lessonId: string }).lessonId,
          courseId:
            typeof (item as { courseId?: unknown }).courseId === 'string'
              ? (item as { courseId: string }).courseId
              : undefined,
          completedAt:
            typeof (item as { completedAt?: unknown }).completedAt === 'string'
              ? (item as { completedAt: string }).completedAt
              : new Date().toISOString(),
        });
      }
    }

    if (items.length === 0) {
      return NextResponse.json({ error: 'Nenhum item válido na requisição.' }, { status: 400 });
    }

    // Zero Trust: aulas só são reconhecidas dentro do tenant do chamador
    // (escopo via relação Course → tenantId).
    const db = getTenantDb(tenantId);
    const lessons = await db.lesson.findMany({
      where: { id: { in: items.map((i) => i.lessonId) }, course: { is: { tenantId } } },
      select: { id: true, title: true, pointsAssigned: true },
    });
    const lessonMap = new Map(lessons.map((l) => [l.id, l]));

    const validItems = items.filter((i) => lessonMap.has(i.lessonId));
    const skipped = items.length - validItems.length;

    const allItems = items.map((i) => ({
      lessonId: i.lessonId,
      status: lessonMap.has(i.lessonId) ? 'synced' : 'invalid',
    }));

    if (validItems.length === 0) {
      return NextResponse.json({ synced: 0, duplicates: 0, skipped, items: allItems });
    }

    const result = await db.$transaction(async (tx) => {
      // Idempotência estrita: skipDuplicates respeita a constraint
      // UNIQUE(userId, lessonId) — conclusões repetidas nunca pontuam 2x.
      const created = await tx.lessonCompletion.createMany({
        data: validItems.map((i) => ({ userId, tenantId, lessonId: i.lessonId })),
        skipDuplicates: true,
      });

      // createMany preserva a ordem de `data`; skipDuplicates pula na ordem,
      // portanto os primeiros `created.count` itens são os novos.
      const newItems = validItems.slice(0, created.count);
      const ledgerItems = newItems.filter((i) => (lessonMap.get(i.lessonId)?.pointsAssigned ?? 0) > 0);
      const totalPoints = ledgerItems.reduce(
        (sum, i) => sum + (lessonMap.get(i.lessonId)?.pointsAssigned ?? 0),
        0,
      );

      if (totalPoints > 0) {
        await tx.user.update({
          where: { id: userId },
          data: { pointsBalance: { increment: totalPoints } },
        });
      }

      if (ledgerItems.length > 0) {
        await tx.pointsLedger.createMany({
          data: ledgerItems.map((i) => {
            const lesson = lessonMap.get(i.lessonId);
            return {
              userId,
              tenantId,
              type: 'gain',
              pointsAmount: lesson?.pointsAssigned ?? 0,
              description: `Aula concluída (sincronização offline): ${lesson?.title ?? i.lessonId}`,
            };
          }),
        });
      }

      return { count: created.count };
    });

    return NextResponse.json({
      synced: result.count,
      duplicates: validItems.length - result.count,
      skipped,
      items: allItems,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Não autenticado.') {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }
    console.error('POST /api/lessons/sync:', error);
    return NextResponse.json({ error: 'Erro interno ao sincronizar.' }, { status: 500 });
  }
}
