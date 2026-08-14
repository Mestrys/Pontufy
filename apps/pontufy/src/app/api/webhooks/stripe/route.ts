import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';
import { prisma } from '@/backend/db';
import { logAudit } from '@/lib/audit';
import { sendWelcomeEmail, sendPasswordResetEmail } from '@/lib/email';
import { getStripe } from '@/lib/stripe';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${buf.toString('hex')}`;
}

const DEFAULT_CREDITS: Record<string, number> = {
  starter: 50,
  professional: 200,
  enterprise: 1000,
};

async function markProcessed(eventId: string, tenantId: string | null): Promise<void> {
  try {
    await prisma.stripeEvent.update({ where: { eventId }, data: { tenantId } });
  } catch (error) {
    console.error('StripeEvent update failed:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('stripe-signature') || '';
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

    if (!webhookSecret) {
      return NextResponse.json(
        { error: 'STRIPE_WEBHOOK_SECRET não configurada.' },
        { status: 500 },
      );
    }

    const stripe = getStripe();

    // Validação obrigatória da assinatura via SDK (raw body + secret).
    // constructEventAsync usa o corpo exato recebido — nunca re-serializar.
    const event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);

    // ── Idempotência: Stripe redelivers até receber 2xx. ─────────────────
    const existing = await prisma.stripeEvent.findUnique({
      where: { eventId: event.id },
    });
    if (existing) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    try {
      await prisma.stripeEvent.create({
        data: { eventId: event.id, type: event.type },
      });
    } catch (error) {
      // P2002 — entrega concorrente venceu a corrida; não processar de novo.
      if (error instanceof Error && 'code' in error && (error as { code?: string }).code === 'P2002') {
        return NextResponse.json({ received: true, duplicate: true });
      }
      throw error;
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata || {};
        const tenantId = metadata.tenant_id || metadata.tenantId || null;

        // Novo fluxo: tenant já existe (onboarding self-service) — ativar
        // subscrição e créditos contratados.
        if (tenantId) {
          const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
          if (!tenant) {
            return NextResponse.json({ error: 'TENANT_NOT_FOUND' }, { status: 404 });
          }

          const plan = metadata.plan === 'enterprise' ? 'enterprise' : 'starter';
          const aiCredits = DEFAULT_CREDITS[plan] ?? DEFAULT_CREDITS.starter;

          await prisma.tenant.update({
            where: { id: tenant.id },
            data: {
              plan,
              stripeCustomerId:
                typeof session.customer === 'string'
                  ? session.customer
                  : tenant.stripeCustomerId,
              stripeSubscriptionId:
                typeof session.subscription === 'string'
                  ? session.subscription
                  : tenant.stripeSubscriptionId,
              stripePriceId: metadata.price_id ?? tenant.stripePriceId,
              subscriptionStatus: 'active',
              trialEndsAt: null,
              aiCredits,
            },
          });

          await logAudit({
            tenantId: tenant.id,
            action: 'SUBSCRIPTION_ACTIVATED',
            entity: 'Tenant',
            entityId: tenant.id,
            newValue: { plan, aiCredits, eventId: event.id },
          });

          await markProcessed(event.id, tenant.id);
          return NextResponse.json({ received: true, tenantId });
        }

        // Fluxo legado (checkout sem tenantId): auto-criação de empresa via
        // checkout — o admin define a senha por link de setup out-of-band.
        const companyName = metadata.company_name;
        const email = session.customer_email || metadata.admin_email;
        const sector = metadata.sector || 'tech';
        const plan = metadata.plan || 'starter';

        if (!companyName || !email) {
          return NextResponse.json({ error: 'MISSING_METADATA' }, { status: 400 });
        }

        const existingTenant = await prisma.tenant.findFirst({
          where: { name: companyName },
        });

        if (existingTenant) {
          await markProcessed(event.id, existingTenant.id);
          return NextResponse.json({
            success: true,
            message: 'TENANT_EXISTS',
            tenantId: existingTenant.id,
          });
        }

        const unusablePassword = await hashPassword(randomBytes(32).toString('hex'));
        const aiCredits = DEFAULT_CREDITS[plan] || DEFAULT_CREDITS.starter;
        const setupToken = randomBytes(32).toString('hex');
        const setupExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const result = await prisma.$transaction(async (tx) => {
          const tenant = await tx.tenant.create({
            data: {
              name: companyName,
              slug: `${companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 48)}-${randomBytes(3).toString('hex')}`,
              sector,
              contractStatus: 'active',
              plan,
              aiCredits,
              stripeCustomerId:
                typeof session.customer === 'string' ? session.customer : null,
              stripeSubscriptionId:
                typeof session.subscription === 'string' ? session.subscription : null,
              subscriptionStatus: 'active',
            },
          });

          const admin = await tx.user.create({
            data: {
              tenantId: tenant.id,
              name: `Admin ${companyName}`,
              email,
              role: 'admin_rh',
              passwordHash: unusablePassword,
              pointsBalance: 0,
            },
          });

          await tx.passwordReset.create({
            data: { userId: admin.id, token: setupToken, expiresAt: setupExpiresAt },
          });

          return { tenant, admin };
        });

        await logAudit({
          tenantId: result.tenant.id,
          userId: result.admin.id,
          action: 'TENANT_ONBOARDED',
          entity: 'Tenant',
          entityId: result.tenant.id,
          newValue: {
            tenantId: result.tenant.id,
            companyName,
            sector,
            plan,
            adminEmail: email,
          },
        });

        sendWelcomeEmail(email, `Admin ${companyName}`).catch(() => {});
        sendPasswordResetEmail(email, setupToken).catch(() => {});
        await markProcessed(event.id, result.tenant.id);

        return NextResponse.json({
          success: true,
          tenantId: result.tenant.id,
          adminEmail: email,
        });
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;

        const tenant = await prisma.tenant.findFirst({
          where: {
            OR: [{ stripeCustomerId: customerId || undefined }, { stripeSubscriptionId: subscription.id }],
          },
        });

        if (tenant) {
          await prisma.tenant.update({
            where: { id: tenant.id },
            data: {
              subscriptionStatus:
                event.type === 'customer.subscription.deleted' ? 'canceled' : subscription.status,
              trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
            },
          });
          await markProcessed(event.id, tenant.id);
        } else {
          await markProcessed(event.id, null);
        }
        return NextResponse.json({ received: true });
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;

        const tenant = customerId
          ? await prisma.tenant.findFirst({ where: { stripeCustomerId: customerId } })
          : null;

        if (tenant) {
          await prisma.tenant.update({
            where: { id: tenant.id },
            data: { subscriptionStatus: 'past_due' },
          });
          await markProcessed(event.id, tenant.id);
        } else {
          await markProcessed(event.id, null);
        }
        return NextResponse.json({ received: true });
      }

      default:
        await markProcessed(event.id, null);
        return NextResponse.json({ received: true });
    }
  } catch (error) {
    console.error('POST /api/webhooks/stripe:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}