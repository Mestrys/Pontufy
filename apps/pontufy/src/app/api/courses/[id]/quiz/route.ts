import { NextResponse } from 'next/server';
import { getSessionContext } from '@/backend/session';
import { getTenantDb } from '@/backend/db';
import { acquireLock, releaseLock } from '@/lib/redis/mutex';

// Submissão server-side do quiz final. A nota NUNCA é aceita do cliente — o
// servidor re-scora com o quizJson do curso. Aprovação exige >= 70%.
// Bônus de pontos concedido apenas na PRIMEIRA aprovação (lock distribuído
// impede crédito duplo em submissões concorrentes).

export const QUIZ_BONUS_POINTS = 50;
export const QUIZ_MIN_PERCENTAGE = 0.7;

interface QuizQuestion {
  question: string;
  options: { text: string }[];
  correctIndex: number;
}

interface QuizModule {
  module: string;
  questions: QuizQuestion[];
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { tenantId, userId } = await getSessionContext();
    const { id } = await params;
    const db = getTenantDb(tenantId);

    const body = await request.json().catch(() => null);
    const answers: unknown = body?.answers;

    const course = await db.course.findFirst({
      where: { id, status: 'published' },
      select: { id: true, title: true, quizJson: true },
    });
    if (!course) {
      return NextResponse.json({ error: 'Curso não encontrado.' }, { status: 404 });
    }
    if (!course.quizJson) {
      return NextResponse.json({ error: 'Este curso não possui quiz de avaliação.' }, { status: 400 });
    }

    let modules: QuizModule[] = [];
    try {
      modules = JSON.parse(course.quizJson);
    } catch {
      return NextResponse.json({ error: 'Quiz inválido no servidor.' }, { status: 500 });
    }
    const questions = modules.flatMap((m) => m.questions ?? []);
    if (questions.length === 0) {
      return NextResponse.json({ error: 'Este curso não possui questões.' }, { status: 400 });
    }

    // Escore server-side: ignora respostas malformadas (tratadas como erradas).
    const selected = Array.isArray(answers) ? answers : [];
    let score = 0;
    for (let i = 0; i < questions.length; i++) {
      const chosen = selected[i];
      const optionsCount = questions[i].options?.length ?? 0;
      if (
        Number.isInteger(chosen) &&
        typeof chosen === 'number' &&
        chosen >= 0 &&
        chosen < optionsCount &&
        chosen === questions[i].correctIndex
      ) {
        score++;
      }
    }

    const total = questions.length;
    const passed = score / total >= QUIZ_MIN_PERCENTAGE;

    const lockKey = `lock:quiz:${tenantId}:${userId}:${id}`;
    const lockAcquired = await acquireLock(lockKey, 10);
    if (!lockAcquired) {
      return NextResponse.json({ error: 'Transação já em andamento. Aguarde.' }, { status: 429 });
    }

    try {
      let bonusAwarded = false;
      let newBalance: number | undefined;

      await db.$transaction(async (tx) => {
        const attempt = await tx.quizAttempt.create({
          data: { userId, tenantId, courseId: id, score, total, passed },
        });

        if (passed) {
          // Bônus apenas na primeira aprovação deste (userId, courseId).
          const previousPass = await tx.quizAttempt.findFirst({
            where: { userId, courseId: id, passed: true, id: { not: attempt.id } },
            select: { id: true },
          });
          if (!previousPass) {
            const updated = await tx.user.update({
              where: { id: userId },
              data: { pointsBalance: { increment: QUIZ_BONUS_POINTS } },
            });
            await tx.pointsLedger.create({
              data: {
                userId,
                tenantId,
                type: 'gain',
                pointsAmount: QUIZ_BONUS_POINTS,
                description: `Aprovação no Quiz: ${course.title}`,
              },
            });
            bonusAwarded = true;
            newBalance = updated.pointsBalance;
          }
        }
      });

      return NextResponse.json({
        success: true,
        score,
        total,
        passed,
        percentage: Math.round((score / total) * 100),
        bonusAwarded,
        newBalance,
      });
    } finally {
      await releaseLock(lockKey);
    }
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Não autenticado.') {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }
    console.error('POST /api/courses/[id]/quiz:', error);
    return NextResponse.json({ error: 'Erro interno ao registrar o quiz.' }, { status: 500 });
  }
}