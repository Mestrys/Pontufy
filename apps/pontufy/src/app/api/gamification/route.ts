import { NextResponse } from 'next/server';
import { getSessionContext } from '@/backend/session';
import { getTenantDb } from '@/backend/db';
import { getStreak, getUserStats, getUnlockedAchievements } from '@/lib/gamification';

// ═══════════════════════════════════════════════════════════════════════════
// TAREFA 11 — Gamificação: streak, ranking por XP e conquistas do usuário.
// Ranking = pontos ACUMULADOS (gains no ledger), nunca saldo atual — um
// resgate não deve rebaixar a posição do colaborador.
// ═══════════════════════════════════════════════════════════════════════════

export async function GET() {
  try {
    const { tenantId, userId } = await getSessionContext();
    const db = getTenantDb(tenantId);

    const [streak, stats, achievements, rankingRows, myRank] = await Promise.all([
      getStreak(userId, tenantId),
      getUserStats(userId, tenantId),
      getUnlockedAchievements(userId, tenantId),
      db.pointsLedger.groupBy({
        by: ['userId'],
        where: { type: 'gain' },
        _sum: { pointsAmount: true },
        orderBy: { _sum: { pointsAmount: 'desc' } },
        take: 10,
      }),
      // Posição do próprio usuário: conta quantos ganharam MAIS que ele.
      db.pointsLedger.groupBy({
        by: ['userId'],
        where: { type: 'gain' },
        _sum: { pointsAmount: true },
      }),
    ]);

    const userIds = rankingRows.map((r) => r.userId);
    const users = userIds.length > 0
      ? await db.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, email: true },
        })
      : [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    const myTotal = myRank.find((r) => r.userId === userId)?._sum.pointsAmount ?? 0;
    const myPosition = myRank.filter((r) => (r._sum.pointsAmount ?? 0) > myTotal).length + 1;

    const ranking = rankingRows
      .map((row, index) => ({
        position: index + 1,
        userId: row.userId,
        name: userMap.get(row.userId)?.name ?? 'Colaborador',
        email: userMap.get(row.userId)?.email ?? '',
        xp: row._sum.pointsAmount ?? 0,
        isMe: row.userId === userId,
      }))
      .filter((r) => r.xp > 0);

    return NextResponse.json({
      success: true,
      streak,
      stats,
      achievements: achievements.map((a) => a.id),
      ranking,
      myRank: { position: myPosition, xp: myTotal },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Não autenticado.') {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }
    console.error('GET /api/gamification:', error);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}