import { NextResponse } from 'next/server';
import { getSessionContext } from '@/backend/session';
import { getTenantDb } from '@/backend/db';
import { getStripe } from '@/lib/stripe';
import { resolveBaseUrl } from '@/lib/email';

export async function POST() {
  try {
    const { tenantId, role } = await getSessionContext();

    if (role !== 'admin_rh') {
      return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 });
    }

    const db = getTenantDb(tenantId);
    const tenant = await db.tenant.findUnique({ where: { id: tenantId } });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant não encontrado.' }, { status: 404 });
    }

    if (!tenant.stripeCustomerId) {
      return NextResponse.json(
        { error: 'Nenhuma assinatura ativa para este tenant.' },
        { status: 400 },
      );
    }

    const stripe = getStripe();
    const portal = await stripe.billingPortal.sessions.create({
      customer: tenant.stripeCustomerId,
      return_url: `${resolveBaseUrl()}/admin/billing`,
    });

    return NextResponse.json({ url: portal.url });
  } catch (error) {
    if (error instanceof Error && error.message === 'Não autenticado.') {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }
    console.error('POST /api/billing/portal:', error);
    return NextResponse.json({ error: 'Erro interno ao abrir portal.' }, { status: 500 });
  }
}