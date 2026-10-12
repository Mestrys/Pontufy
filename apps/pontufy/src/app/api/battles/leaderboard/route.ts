import { NextResponse } from 'next/server';
import { getSessionContext } from '@/backend/session';
import { getDepartmentRanking } from '@/lib/dept-ranking';

// TAREFA 13.2 — Ranking semanal interdepartamental (Redis em tempo real
// com fallback no Postgres) + progresso do bônus coletivo (13.5).

export async function GET() {
  try {
    const { tenantId } = await getSessionContext();
    const ranking = await getDepartmentRanking(tenantId);

    return NextResponse.json({ success: true, ranking });
  } catch (error) {
    if (error instanceof Error && error.message === 'Não autenticado.') {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }
    console.error('GET /api/battles/leaderboard:', error);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}