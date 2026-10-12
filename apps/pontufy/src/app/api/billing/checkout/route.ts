import { NextResponse } from 'next/server';
import { getSessionContext } from '@/backend/session';
import { getTenantDb } from '@/backend/db';
import { getStripe, getPriceId, getPlanConfig } from '@/lib/stripe';
import { resolveBaseUrl } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { tenantId, role, userId } = await getSessionContext();

    if (role !== 'admin_rh') {
      return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 });
    }

    const body = await request.json();
    const { plan } = body;

    const planConfig = getPlanConfig(plan);
    if (!planConfig) {
      return NextResponse.json(
        { error: 'Plano inválido. Valores aceitos: starter, enterprise' },
        { status: 400 },
      );
    }

    const db = getTenantDb(tenantId);
    const [tenant, admin] = await Promise.all([
      db.tenant.findUnique({ where: { id: tenantId } }),
      db.user.findFirst({ where: { id: userId, tenantId } }),
    ]);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant não encontrado.' }, { status: 404 });
    }

    const priceId = getPriceId(plan);

    const stripe = getStripe();

    // Garante um customer Stripe vinculado ao tenant (criado uma única vez).
    let customerId = tenant.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: admin?.email ?? undefined,
        name: tenant.name,
        metadata: { tenantId },
      });
      customerId = customer.id;
      await db.tenant.update({
        where: { id: tenantId },
        data: { stripeCustomerId: customerId },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        tenantId,
        plan,
        price_id: priceId,
      },
      subscription_data: {
        metadata: { tenantId, plan },
      },
      success_url: `${resolveBaseUrl()}/admin/billing?status=success`,
      cancel_url: `${resolveBaseUrl()}/admin/billing?status=canceled`,
      client_reference_id: tenantId,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (error instanceof Error && error.message === 'Não autenticado.') {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }
    console.error('POST /api/billing/checkout:', error);
    return NextResponse.json({ error: 'Erro interno ao iniciar checkout.' }, { status: 500 });
  }
}
