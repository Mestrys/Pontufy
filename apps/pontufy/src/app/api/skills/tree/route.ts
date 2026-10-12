import { NextResponse } from 'next/server';
import { getSessionContext } from '@/backend/session';
import { getSkillTree } from '@/lib/skill-tree';

// TAREFA 12.2/12.4 — Árvore de Habilidades do usuário com proficiência
// calculada em tempo real.
export async function GET() {
  try {
    const { tenantId, userId } = await getSessionContext();
    const tree = await getSkillTree(tenantId, userId);
    return NextResponse.json({ success: true, skills: tree });
  } catch (error) {
    if (error instanceof Error && error.message === 'Não autenticado.') {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }
    console.error('GET /api/skills/tree:', error);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}