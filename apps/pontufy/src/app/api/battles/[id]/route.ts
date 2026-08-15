import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionContext } from '@/backend/session';
import { getTenantDb } from '@/backend/db';
import { acquireLock, releaseLock } from '@/lib/redis/mutex';
import {
  scoreBattleTurn,
  TURN_TIME_LIMIT_SECONDS,
  QUESTION_TIME_LIMIT_SECONDS,
  type BattleQuestion,
} from '@/lib/battles';
import { creditDepartmentPoints } from '@/lib/dept-ranking';
import { parseBody } from '@/lib/validations';

// TAREFA 13.1/13.4 — Turno da batalha: re-score server-side + travas de
// integridade (cronômetro estrito + perda de foco anula o turno).

const answerSchema = z.object({
  answers: z.array(z.number().int().min(-1).max(5)).max(10),
  elapsedSeconds: z.number().int().min(0).max(600),
  focusLost: z.boolean().optional(),
});

export const BATTLE_POINTS_PER_CORRECT = 5;

// GET — Entrega as questões SOMENTE ao participante cujo turno está aberto
// (anti-trapaça: o desafiante nunca vê as questões antes do oponente responder).
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { tenantId, userId } = await getSessionContext();
    const { id } = await params;
    const db = getTenantDb(tenantId);

    const battle = await db.battle.findFirst({ where: { id, tenantId } });
    if (!battle) {
      return NextResponse.json({ error: 'Batalha não encontrada.' }, { status: 404 });
    }

    const isChallenger = battle.challengerId === userId;
    const isOpponent = battle.opponentId === userId;
    if (!isChallenger && !isOpponent) {
      return NextResponse.json({ error: 'Você não participa desta batalha.' }, { status: 403 });
    }

    const myTurnDone = isChallenger
      ? battle.challengerElapsed !== null
      : battle.opponentElapsed !== null;

    // Turno do challenger = desafiante responde PRIMEIRO; oponente responde depois.
    const isMyTurn = isChallenger
      ? !myTurnDone
      : battle.challengerElapsed !== null && !myTurnDone;

    if (!isMyTurn) {
      return NextResponse.json({ error: 'Ainda não é o seu turno.' }, { status: 403 });
    }

    let questions: BattleQuestion[] = [];
    try {
      questions = (JSON.parse(battle.questionsJson) as { questions: BattleQuestion[] }).questions;
    } catch {
      return NextResponse.json({ error: 'Batalha corrompida.' }, { status: 500 });
    }

    const sanitized = questions.map((q) => ({
      question: q.question,
      options: q.options,
    }));

    return NextResponse.json({
      success: true,
      questions: sanitized,
      questionTimeLimit: QUESTION_TIME_LIMIT_SECONDS,
      turnTimeLimit: TURN_TIME_LIMIT_SECONDS,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Não autenticado.') {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }
    console.error('GET /api/battles/[id]:', error);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { tenantId, userId } = await getSessionContext();
    const { id } = await params;
    const db = getTenantDb(tenantId);

    const raw = await request.json().catch(() => null);
    const { data, error } = parseBody(answerSchema, raw);
    if (error) return NextResponse.json({ error }, { status: 400 });

    const battle = await db.battle.findFirst({ where: { id, tenantId } });
    if (!battle) {
      return NextResponse.json({ error: 'Batalha não encontrada.' }, { status: 404 });
    }

    const isChallenger = battle.challengerId === userId;
    const isOpponent = battle.opponentId === userId;
    if (!isChallenger && !isOpponent) {
      return NextResponse.json({ error: 'Você não participa desta batalha.' }, { status: 403 });
    }

    if (battle.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Este desafio expirou.' }, { status: 410 });
    }

    const turnDone = isChallenger ? battle.challengerElapsed !== null : battle.opponentElapsed !== null;
    if (turnDone) {
      return NextResponse.json({ error: 'Seu turno já foi registrado.' }, { status: 409 });
    }
    if (battle.status === 'completed') {
      return NextResponse.json({ error: 'Batalha já finalizada.' }, { status: 409 });
    }

    // ── 13.4 — Trava de integridade: cronômetro estrito por questão ────────
    let forfeited = false;
    if (data.focusLost) {
      // Perda de foco na janela: turno anulado (anti-copy-paste/outra aba).
      forfeited = true;
    } else if (data.elapsedSeconds > TURN_TIME_LIMIT_SECONDS) {
      forfeited = true;
    }

    let questions: BattleQuestion[] = [];
    try {
      questions = (JSON.parse(battle.questionsJson) as { questions: BattleQuestion[] }).questions;
    } catch {
      return NextResponse.json({ error: 'Batalha corrompida.' }, { status: 500 });
    }

    const correct = forfeited
      ? questions.map(() => false)
      : scoreBattleTurn(questions, data.answers);
    const score = correct.filter(Boolean).length;

    const lockKey = `lock:battle:${tenantId}:${id}`;
    const lockAcquired = await acquireLock(lockKey, 10);
    if (!lockAcquired) {
      return NextResponse.json({ error: 'Transação já em andamento. Aguarde.' }, { status: 429 });
    }

    try {
      const updated = await db.battle.update({
        where: { id: battle.id },
        data: isChallenger
          ? { challengerScore: score, challengerElapsed: data.elapsedSeconds }
          : { opponentScore: score, opponentElapsed: data.elapsedSeconds },
      });

      const bothDone =
        updated.challengerElapsed !== null && updated.opponentElapsed !== null;

      let winnerId: string | null = null;

      if (bothDone) {
        winnerId =
          updated.challengerScore > updated.opponentScore
            ? updated.challengerId
            : updated.opponentScore > updated.challengerScore
              ? updated.opponentId
              : null;

        await db.battle.update({
          where: { id: battle.id },
          data: { status: 'completed', winnerId, forfeitedBy: forfeited ? userId : null },
        });

        // Pontos do duelo: 5 por acerto, creditados no ranking do departamento.
        const [challenger, opponent] = await Promise.all([
          db.user.findFirst({ where: { id: updated.challengerId }, select: { department: true } }),
          db.user.findFirst({ where: { id: updated.opponentId }, select: { department: true } }),
        ]);
        const challengerPoints = updated.challengerScore * BATTLE_POINTS_PER_CORRECT;
        const opponentPoints = updated.opponentScore * BATTLE_POINTS_PER_CORRECT;
        await Promise.all([
          creditDepartmentPoints(tenantId, challenger?.department ?? null, challengerPoints),
          creditDepartmentPoints(tenantId, opponent?.department ?? null, opponentPoints),
        ]);
      }

      return NextResponse.json({
        success: true,
        score,
        correct,
        forfeited,
        completed: bothDone,
        winnerId,
      });
    } finally {
      await releaseLock(lockKey);
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'Não autenticado.') {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }
    console.error('POST /api/battles/[id]:', error);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}