import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionContext } from '@/backend/session';
import { logAudit, extractRequestMeta } from '@/lib/audit';
import { assignPdiNode, listPdiTargets } from '@/lib/skill-tree';
import { parseBody } from '@/lib/validations';

// TAREFA 12.5 — PDI: vincula nós da árvore a planos de desenvolvimento
// individuais dos colaboradores (admin_rh).

const pdiSchema = z.object({
  userId: z.string().uuid(),
  skillNodeId: z.string().uuid(),
});

export async function GET() {
  try {
    const { tenantId, role } = await getSessionContext();
    if (role !== 'admin_rh') {
      return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 });
    }
    const pdis = await listPdiTargets(tenantId);
    return NextResponse.json({ success: true, pdis });
  } catch (error) {
    if (error instanceof Error && error.message === 'Não autenticado.') {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }
    console.error('GET /api/admin/skills/pdi:', error);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { tenantId, role, userId } = await getSessionContext();
    if (role !== 'admin_rh') {
      return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 });
    }

    const raw = await request.json().catch(() => null);
    const { data, error } = parseBody(pdiSchema, raw);
    if (error) return NextResponse.json({ error }, { status: 400 });

    await assignPdiNode(tenantId, data.userId, data.skillNodeId);

    const meta = extractRequestMeta(request);
    await logAudit({
      tenantId,
      userId,
      action: 'PDI_NODE_ASSIGNED',
      entity: 'UserSkillProgress',
      entityId: data.skillNodeId,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      newValue: { userId: data.userId, skillNodeId: data.skillNodeId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Não autenticado.') {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }
    console.error('POST /api/admin/skills/pdi:', error);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}