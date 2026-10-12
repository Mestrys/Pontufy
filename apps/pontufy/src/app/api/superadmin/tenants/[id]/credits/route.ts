import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/backend/db';
import { logAudit, extractRequestMeta } from '@/lib/audit';

// Consola global de governança — exclusiva para super_admin @pontufy.com.
// Visão consolidada entre empresas via cliente Prisma direto (única exceção
// ao Zero Trust, por design); a escrita é auditada no tenant alvo.
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (
      !session?.user ||
      session.user.role !== 'super_admin' ||
      !session.user.email?.endsWith('@pontufy.com')
    ) {
      return NextResponse.json({ error: 'Acesso restrito.' }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const aiCredits = body?.aiCredits;

    if (typeof aiCredits !== 'number' || !Number.isInteger(aiCredits) || aiCredits < 0 || aiCredits > 1_000_000) {
      return NextResponse.json(
        { error: 'Créditos de IA inválidos (inteiro entre 0 e 1.000.000).' },
        { status: 400 },
      );
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      select: { id: true, name: true, aiCredits: true },
    });
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant não encontrado.' }, { status: 404 });
    }

    const updated = await prisma.tenant.update({
      where: { id },
      data: { aiCredits },
      select: { id: true, name: true, aiCredits: true },
    });

    const meta = extractRequestMeta(request);
    await logAudit({
      tenantId: tenant.id,
      userId: session.user.id,
      action: 'AI_CREDITS_ADJUSTED',
      entity: 'Tenant',
      entityId: tenant.id,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      oldValue: { aiCredits: tenant.aiCredits },
      newValue: { aiCredits: updated.aiCredits },
    });

    return NextResponse.json({ success: true, tenant: updated });
  } catch (error) {
    if (error instanceof Error && error.message === 'Não autenticado.') {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }
    console.error('PATCH /api/superadmin/tenants/[id]/credits:', error);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}