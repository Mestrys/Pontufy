import { NextResponse } from 'next/server';
import { getSessionContext } from '@/backend/session';
import { getTenantDb } from '@/backend/db';

// TAREFA 13.1 — Lista de colegas disponíveis para desafio (mesmo tenant).

export async function GET() {
  try {
    const { tenantId, userId } = await getSessionContext();
    const db = getTenantDb(tenantId);

    const users = await db.user.findMany({
      where: { tenantId, id: { not: userId } },
      select: { id: true, name: true, department: true },
      orderBy: { name: 'asc' },
      take: 60,
    });

    return NextResponse.json({
      success: true,
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        department: u.department ?? null,
      })),
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Não autenticado.') {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }
    console.error('GET /api/battles/opponents:', error);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}