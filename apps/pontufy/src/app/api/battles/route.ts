import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionContext } from '@/backend/session';
import { getTenantDb } from '@/backend/db';
import { logAudit, extractRequestMeta } from '@/lib/audit';
import {
  generateBattleQuestions,
  BATTLE_TTL_HOURS,
  safeTopics,
  getTenantCourseTitles,
} from '@/lib/battles';
import { parseBody } from '@/lib/validations';
import { notifySystem, notifyBattleChallenge } from '@/lib/notifications';

// TAREFA 13.1 — Criação de desafio 1x1 assíncrono (5 questões geradas por IA).

const createSchema = z.object({
  opponentId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const { tenantId, userId } = await getSessionContext();
    const raw = await request.json().catch(() => null);
    const { data, error } = parseBody(createSchema, raw);
    if (error) return NextResponse.json({ error }, { status: 400 });

    const db = getTenantDb(tenantId);

    const opponent = await db.user.findFirst({
      where: { id: data.opponentId, tenantId },
      select: { id: true, name: true },
    });
    if (!opponent) {
      return NextResponse.json({ error: 'Oponente não encontrado.' }, { status: 404 });
    }
    if (opponent.id === userId) {
      return NextResponse.json({ error: 'Você não pode desafiar a si mesmo.' }, { status: 400 });
    }

    // Anti-flood: no máximo 3 desafios pendentes ao mesmo oponente.
    const pending = await db.battle.count({
      where: {
        tenantId,
        challengerId: userId,
        opponentId: opponent.id,
        status: 'pending',
      },
    });
    if (pending >= 3) {
      return NextResponse.json({ error: 'Muitos desafios pendentes com este colega.' }, { status: 429 });
    }

    // 13.1 — Gera as questões sobre a trilha da empresa (IA + fallback local).
    const topics = safeTopics(await getTenantCourseTitles(tenantId));
    const questions = await generateBattleQuestions(tenantId, topics);
    const questionsJson = JSON.stringify({ questions });

    const battle = await db.battle.create({
      data: {
        tenantId,
        challengerId: userId,
        opponentId: opponent.id,
        questionsJson,
        expiresAt: new Date(Date.now() + BATTLE_TTL_HOURS * 60 * 60 * 1000),
      },
    });

    const meta = extractRequestMeta(request);
    await logAudit({
      tenantId,
      userId,
      action: 'BATTLE_CREATED',
      entity: 'Battle',
      entityId: battle.id,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      newValue: { opponentId: opponent.id, questions: questions.length },
    });

    notifyBattleChallenge({
      tenantId,
      userId: opponent.id,
      challengerName: (await db.user.findFirst({ where: { id: userId }, select: { name: true } }))?.name || 'Um colega',
      battleId: battle.id,
    });

    return NextResponse.json({ success: true, battleId: battle.id });
  } catch (error) {
    if (error instanceof Error && error.message === 'Não autenticado.') {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }
    console.error('POST /api/battles:', error);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { tenantId, userId } = await getSessionContext();
    const db = getTenantDb(tenantId);

    const battles = await db.battle.findMany({
      where: {
        tenantId,
        OR: [{ challengerId: userId }, { opponentId: userId }],
      },
      include: {
        challenger: { select: { name: true } },
        opponent: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    return NextResponse.json({
      success: true,
      battles: battles.map((b) => ({
        id: b.id,
        status: b.status,
        challengerName: b.challenger.name,
        opponentName: b.opponent.name,
        challengerScore: b.challengerScore,
        opponentScore: b.opponentScore,
        challengerAnswered: b.challengerElapsed !== null,
        opponentAnswered: b.opponentElapsed !== null,
        forfeitedBy: b.forfeitedBy,
        winnerId: b.winnerId,
        createdAt: b.createdAt.toISOString(),
        expiresAt: b.expiresAt.toISOString(),
        isMine: b.challengerId === userId ? 'challenger' : b.opponentId === userId ? 'opponent' : null,
      })),
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Não autenticado.') {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }
    console.error('GET /api/battles:', error);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}