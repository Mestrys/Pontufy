import { NextResponse } from 'next/server';
import { getSessionContext } from '@/backend/session';
import { getTenantDb } from '@/backend/db';
import { decrementUnreadCount } from '@/lib/redis';

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { tenantId, userId } = await getSessionContext();
    const db = getTenantDb(tenantId);

    const { id } = await params;

    // Scoped by tenantId (interceptor) + userId (explícito) — nunca marca
    // notificações de outro utilizador ou locatário como lidas.
    const result = await db.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: 'Notificação não encontrada.' }, { status: 404 });
    }

    // Decrementa contador Redis de não-lidas
    decrementUnreadCount(tenantId, userId, 1).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Não autenticado.') {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }
    console.error('PATCH /api/notifications/[id]/read:', error);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}