import { NextResponse } from 'next/server';
import { getSessionContext } from '@/backend/session';
import { getTenantDb } from '@/backend/db';

export async function GET() {
  try {
    const { tenantId } = await getSessionContext();
    const db = getTenantDb(tenantId);

    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, logoUrl: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant não encontrado.' }, { status: 404 });
    }

    return NextResponse.json(tenant);
  } catch (error) {
    if (error instanceof Error && error.message === 'Não autenticado.') {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { tenantId, role } = await getSessionContext();

    if (role !== 'admin_rh') {
      return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 });
    }

    const { logoUrl } = await request.json();

    if (logoUrl !== null && typeof logoUrl !== 'string') {
      return NextResponse.json({ error: 'URL do logo inválida.' }, { status: 400 });
    }

    if (logoUrl && logoUrl.length > 500) {
      return NextResponse.json({ error: 'URL do logo muito longa.' }, { status: 400 });
    }

    const db = getTenantDb(tenantId);
    const tenant = await db.tenant.update({
      where: { id: tenantId },
      data: { logoUrl: logoUrl || null },
      select: { name: true, logoUrl: true },
    });

    return NextResponse.json({ success: true, tenant });
  } catch (error) {
    if (error instanceof Error && error.message === 'Não autenticado.') {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }
    console.error('PATCH /api/admin/tenant/branding:', error);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
