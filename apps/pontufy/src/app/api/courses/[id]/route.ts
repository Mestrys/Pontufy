import { NextResponse } from 'next/server';
import { LESSON_ORDER } from '@/lib/lesson-order';
import { isAiWritten } from '@/lib/ai-course';
import { getSessionContext } from '@/backend/session';
import { getTenantDb } from '@/backend/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { tenantId, userId, role } = await getSessionContext();
    const { id } = await params;
    const db = getTenantDb(tenantId);

    // O RH pode abrir rascunhos (pré-visualização antes de publicar).
    const course = await db.course.findFirst({
      where: role === 'admin_rh' ? { id } : { id, status: 'published' },
      include: {
        lessons: { orderBy: LESSON_ORDER },
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Curso não encontrado.' }, { status: 404 });
    }

    const completions = await db.lessonCompletion.findMany({
      where: {
        userId,
        lessonId: { in: course.lessons.map((l) => l.id) },
      },
      select: { lessonId: true },
    });

    const completedIds = new Set(completions.map((c) => c.lessonId));

    const lessons = course.lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      type: lesson.type,
      contentUrl: lesson.contentUrl,
      points: lesson.pointsAssigned,
      completed: completedIds.has(lesson.id),
    }));

    let quiz = null;
    if (course.quizJson) {
      try { quiz = JSON.parse(course.quizJson); } catch {}
    }

    // Indica se o usuário já aprovou o quiz final (>= 70%, gravado server-side).
    let quizPassed = false;
    if (quiz) {
      const passedAttempt = await db.quizAttempt.findFirst({
        where: { userId, courseId: id, passed: true },
        select: { id: true },
      });
      quizPassed = !!passedAttempt;
    }

    // Transparência de IA: o colaborador vê que o curso foi gerado por IA e
    // quem do RH revisou e publicou (última publicação registrada na auditoria).
    const aiGenerated = await isAiWritten(db, course);
    let reviewedBy: string | null = null;
    if (aiGenerated && course.status === 'published') {
      const published = await db.auditLog.findFirst({
        where: { entity: 'Course', entityId: course.id, action: 'COURSE_PUBLISHED' },
        orderBy: { createdAt: 'desc' },
        select: { user: { select: { name: true } } },
      });
      reviewedBy = published?.user?.name ?? null;
    }

    return NextResponse.json({
      id: course.id,
      title: course.title,
      description: course.description,
      status: course.status,
      aiGenerated,
      reviewedBy,
      lessons,
      quiz,
      quizPassed,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Não autenticado.') {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }
    console.error('GET /api/courses/[id]:', error);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
