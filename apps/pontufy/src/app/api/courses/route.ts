import { NextResponse } from 'next/server';
import { getSessionContext } from '@/backend/session';
import { getTenantDb } from '@/backend/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { tenantId, role } = await getSessionContext();
    const db = getTenantDb(tenantId);

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12', 10)));
    const skip = (page - 1) * limit;
    // Rascunhos (cursos gerados por IA ainda não revisados) só aparecem para o
    // RH e só quando a tela de gestão pede; colaboradores veem só publicados.
    const includeDrafts = role === 'admin_rh' && searchParams.get('includeDrafts') === '1';
    const where = includeDrafts ? {} : { status: 'published' };

    const [courses, total] = await Promise.all([
      db.course.findMany({
        where,
        include: { lessons: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.course.count({ where }),
    ]);

    console.log(`[GET /api/courses] tenantId=${tenantId} returned=${courses.length} total=${total}`);

    return NextResponse.json(
      { data: courses, total, page, limit, totalPages: Math.ceil(total / limit) },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
    );
  } catch (error: any) {
    if (error.message === 'Não autenticado.') {
      return NextResponse.json({ data: [], total: 0, error: 'Não autenticado.' }, { status: 401 });
    }
    console.error('GET /api/courses:', error);
    return NextResponse.json({ data: [], total: 0, error: String(error?.message ?? error) }, { status: 500 });
  }
}
