import { NextResponse } from 'next/server';
import { getSessionContext } from '@/backend/session';
import { getTenantDb } from '@/backend/db';
import { logAudit, extractRequestMeta } from '@/lib/audit';
import { parseDepartment } from '@/lib/validations/department';

// TAREFA 13.2 — O RH é a ÚNICA fonte do departamento do colaborador.
// O colaborador não edita o próprio departamento (evita migrar para o
// departamento líder e manipular o ranking interdepartamental).
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { tenantId, role, userId } = await getSessionContext();

    if (role !== 'admin_rh') {
      return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== 'object' || !('department' in body)) {
      return NextResponse.json({ error: 'Campo "department" é obrigatório.' }, { status: 400 });
    }

    const parsed = parseDepartment((body as { department: unknown }).department);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    // findFirst com tenantId: usuário de outro tenant responde 404 (não 403),
    // sem revelar sua existência.
    const db = getTenantDb(tenantId);
    const target = await db.user.findFirst({
      where: { id, tenantId },
      select: { id: true, department: true },
    });
    if (!target) {
      return NextResponse.json({ error: 'Colaborador não encontrado.' }, { status: 404 });
    }

    if ((target.department ?? null) === parsed.value) {
      return NextResponse.json({ success: true, user: { id: target.id, department: parsed.value } });
    }

    const updated = await db.user.update({
      where: { id: target.id },
      data: { department: parsed.value },
      select: { id: true, department: true },
    });

    const meta = extractRequestMeta(request);
    await logAudit({
      tenantId,
      userId,
      action: 'USER_DEPARTMENT_UPDATED',
      entity: 'User',
      entityId: updated.id,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      oldValue: { department: target.department ?? null },
      newValue: { department: updated.department },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    if (error instanceof Error && error.message === 'Não autenticado.') {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }
    console.error('PATCH /api/admin/users/[id]:', error);
    return NextResponse.json({ error: 'Erro interno ao atualizar colaborador.' }, { status: 500 });
  }
}
