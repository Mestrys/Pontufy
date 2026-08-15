import { NextResponse } from 'next/server';
import { getSessionContext } from '@/backend/session';
import { getTenantDb } from '@/backend/db';
import { acquireLock, releaseLock } from '@/lib/redis/mutex';
import { checkVelocityLimit } from '@/lib/security/velocity';
import { notifyLessonCompleted, notifyStreakMilestone, notifyLevelUp } from '@/lib/notifications';
import { getClientIp, ipRateLimit } from '@/lib/security/auth-guard';
import { tenantRateLimit } from '@/lib/security/rate-limit';
import { completeLessonSchema, parseBody } from '@/lib/validations';
import { burstMultiplier, countCompletionsToday, getStreak, getUserTier, type StreakInfo } from '@/lib/gamification';
import { creditDepartmentStudyHours, awardDepartmentBonusIfGoalMet } from '@/lib/dept-ranking';

const LESSON_IP_MAX = 60;
const LESSON_IP_WINDOW = 60; // 60 req/min/IP
const LESSON_TENANT_MAX = 1200;
const LESSON_TENANT_WINDOW = 60;

export async function POST(request: Request) {
  try {
    // 6.2 — Rate limiting por IP E por tenant (rotas críticas de crédito).
    const ip = getClientIp(request);
    const ipRate = await ipRateLimit(ip, 'lessons-complete', LESSON_IP_MAX, LESSON_IP_WINDOW);
    if (!ipRate.allowed) {
      return NextResponse.json(
        { error: 'Muitas requisições. Aguarde um instante.' },
        { status: 429 },
      );
    }

    const { tenantId, userId } = await getSessionContext();

    const tenantRate = await tenantRateLimit(tenantId, 'lessons-complete', LESSON_TENANT_MAX, LESSON_TENANT_WINDOW);
    if (!tenantRate.allowed) {
      return NextResponse.json(
        { error: 'Limite da empresa atingido. Tente novamente em instantes.' },
        { status: 429 },
      );
    }

    // 8.1 — Validação centralizada via Zod (UUID estrito)
    const raw = await request.json().catch(() => null);
    const { data: body, error: validationError } = parseBody(completeLessonSchema, raw);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }
    const { lessonId } = body;

    const db = getTenantDb(tenantId);

    // Validates lesson exists AND belongs to this tenant (via course.tenantId relation scope).
    const lesson = await db.lesson.findFirst({
      where: { id: lessonId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            workloadHours: true,
            _count: { select: { lessons: true } },
          },
        },
      },
    });
    if (!lesson) {
      return NextResponse.json({ error: 'Aula não encontrada no escopo da empresa.' }, { status: 404 });
    }

    // Distributed lock prevents double-credit if the client fires two concurrent completions.
    const lockKey = `lock:lesson:${tenantId}:${userId}:${lessonId}`;
    const lockAcquired = await acquireLock(lockKey, 10);
    if (!lockAcquired) {
      return NextResponse.json({ error: 'Transação já em andamento. Aguarde.' }, { status: 429 });
    }

    try {
      // Idempotency: return current balance without double-crediting.
      // findFirst required — findUnique rejects the tenantId injected by the interceptor.
      const alreadyCompleted = await db.lessonCompletion.findFirst({
        where: { userId, lessonId },
      });
      if (alreadyCompleted) {
        const user = await db.user.findFirst({ where: { id: userId } });
        return NextResponse.json({
          success: true,
          message: 'Aula já concluída anteriormente.',
          newBalance: user?.pointsBalance ?? 0,
          alreadyCompleted: true,
        });
      }

      const velocity = await checkVelocityLimit(userId, tenantId);
      if (!velocity.allowed) {
        return NextResponse.json({ error: velocity.reason }, { status: 400 });
      }

      // 11.2 — Burst: multiplicador por aulas concluídas HOJE (x1, x1.5, x2).
      const completionsToday = await countCompletionsToday(userId, tenantId);
      const burst = burstMultiplier(completionsToday);
      const pointsToAward = Math.round(lesson.pointsAssigned * burst);

      const result = await db.$transaction(async (tx) => {
        await tx.lessonCompletion.create({ data: { userId, tenantId, lessonId } });

        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: { pointsBalance: { increment: pointsToAward } },
        });

        await tx.pointsLedger.create({
          data: {
            userId,
            tenantId,
            type: 'gain',
            pointsAmount: pointsToAward,
            description:
              burst > 1
                ? `Conclusão da Aula: ${lesson.title} (burst x${burst})`
                : `Conclusão da Aula: ${lesson.title}`,
          },
        });

        return { updatedUser };
      });

      // 11.1/11.5 — Milestone de streak: notifica e celebra marcos de consistência.
      const streak = await getStreak(userId, tenantId);
      const isMilestone = streak.current >= 3 && (streak.current % 3 === 0 || streak.current <= 5);
      if (isMilestone) {
        notifyStreakMilestone({
          tenantId,
          userId,
          streak: streak.current,
          best: streak.best,
        });
      }

      // Level up: notifica quando o saldo cruza o piso do próximo nível.
      const previousPoints = result.updatedUser.pointsBalance - pointsToAward;
      const beforeTier = getUserTier(previousPoints);
      const afterTier = getUserTier(result.updatedUser.pointsBalance);
      if (beforeTier.name !== afterTier.name) {
        notifyLevelUp({
          tenantId,
          userId,
          tierName: afterTier.name,
          pointsBalance: result.updatedUser.pointsBalance,
          link: '/dashboard',
        });
      }

      // Non-blocking: não atrasa nem quebra a resposta principal.
      notifyLessonCompleted({
        tenantId,
        userId,
        lessonTitle: lesson.title,
        courseTitle: lesson.course?.title ?? lesson.title,
        points: pointsToAward,
        link: lesson.course ? `/player/${lesson.course.id}` : undefined,
      });

      // 13.5 — Acumula horas estudadas do departamento (carga do curso ÷ aulas)
      // e concede o bônus coletivo quando a meta semanal for atingida.
      const course = lesson.course;
      const hoursPerLesson =
        course && course.workloadHours > 0
          ? course.workloadHours / Math.max(1, course._count.lessons)
          : 0;
      const user = await db.user.findFirst({ where: { id: userId }, select: { department: true } });
      const department = user?.department ?? null;
      void creditDepartmentStudyHours(tenantId, department, hoursPerLesson);
      void awardDepartmentBonusIfGoalMet(tenantId, department);

      return NextResponse.json({
        success: true,
        message:
          burst > 1
            ? `Você ganhou +${pointsToAward} pontos (burst x${burst})!`
            : `Você ganhou +${pointsToAward} pontos!`,
        newBalance: result.updatedUser.pointsBalance,
        burst,
        streak: streak.current,
      });
    } finally {
      await releaseLock(lockKey);
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'Não autenticado.') {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }
    console.error('Erro ao completar aula:', error);
    return NextResponse.json({ error: 'Falha interna no servidor ao concluir aula.' }, { status: 500 });
  }
}
