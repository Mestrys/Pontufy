import { NextResponse } from 'next/server';
import { getSessionContext } from '@/backend/session';
import { getTenantDb } from '@/backend/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const { tenantId, userId } = await getSessionContext();
    const db = getTenantDb(tenantId);

    const courses = await db.course.findMany({
      where: { status: 'published' },
      include: { lessons: { select: { id: true, title: true }, orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });

    const lessonIds = courses.flatMap((c: any) => c.lessons.map((l: any) => l.id));

    const completions = await db.lessonCompletion.findMany({
      where: { userId, lessonId: { in: lessonIds } },
      select: { lessonId: true, createdAt: true },
    });

    const completedIds = new Set(completions.map((c) => c.lessonId));
    // Última atividade por aula: ordena "Continuar" pelo curso mexido mais recentemente.
    const completedAt = new Map(completions.map((c) => [c.lessonId, c.createdAt.getTime()]));

    const enriched = courses.map((course: any) => {
      const totalLessons = course.lessons.length;
      const completedLessons = course.lessons.filter((l: any) => completedIds.has(l.id)).length;
      const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      let status: 'available' | 'in_progress' | 'completed' = 'available';
      if (completedLessons > 0 && completedLessons < totalLessons) status = 'in_progress';
      else if (completedLessons === totalLessons && totalLessons > 0) status = 'completed';

      const nextLesson = course.lessons.find((l: any) => !completedIds.has(l.id));
      const lastActivity = Math.max(0, ...course.lessons.map((l: any) => completedAt.get(l.id) ?? 0));

      return {
        id: course.id,
        title: course.title,
        description: course.description,
        totalLessons,
        completedLessons,
        progress,
        status,
        nextLessonTitle: nextLesson?.title ?? null,
        lastActivityAt: lastActivity ? new Date(lastActivity).toISOString() : null,
      };
    });

    console.log(`[GET /api/courses/enrolled] tenantId=${tenantId} userId=${userId} returned=${enriched.length}`);

    return NextResponse.json(enriched, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    });
  } catch (error: any) {
    if (error.message === 'Não autenticado.') {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }
    console.error('GET /api/courses/enrolled:', error);
    return NextResponse.json([], { status: 500 });
  }
}
