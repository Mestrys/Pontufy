// File: src/app/api/rewards/redeem/route.ts
// Atomic reward redemption with Lomadee integration and distributed locking

import { NextResponse } from 'next/server';
import { getSessionContext } from '@/backend/session';
import { getTenantDb } from '@/backend/db';
import { acquireLock, releaseLock } from '@/lib/redis/mutex';
import { logAudit, extractRequestMeta } from '@/lib/audit';
import { notifyRewardRedeemed } from '@/lib/notifications';
import { getClientIp, ipRateLimit } from '@/lib/security/auth-guard';
import { tenantRateLimit } from '@/lib/security/rate-limit';
import { parseBody, redeemSchema } from '@/lib/validations';
import { validateAffiliateUrl, sanitizeAiText } from '@/lib/validations/security';
import { createLomadeeTrackedLink } from '@/lib/lomadee';
import { randomUUID } from 'node:crypto';

const REDEEM_IP_MAX = 20;
const REDEEM_IP_WINDOW = 60; // 20 resgates/min/IP
const REDEEM_TENANT_MAX = 200;
const REDEEM_TENANT_WINDOW = 60;

class RedeemError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly missing?: number,
  ) {
    super(message);
    this.name = 'RedeemError';
  }
}

export async function POST(request: Request) {
  try {
    // Rate limiting por IP E por tenant (resgate = desembolso de pontos).
    const ip = getClientIp(request);
    const ipRate = await ipRateLimit(ip, 'rewards-redeem', REDEEM_IP_MAX, REDEEM_IP_WINDOW);
    if (!ipRate.allowed) {
      return NextResponse.json(
        { error: 'Muitos resgates em sequência. Aguarde um instante.' },
        { status: 429 },
      );
    }

    const { tenantId, userId } = await getSessionContext();

    const tenantRate = await tenantRateLimit(tenantId, 'rewards-redeem', REDEEM_TENANT_MAX, REDEEM_TENANT_WINDOW);
    if (!tenantRate.allowed) {
      return NextResponse.json(
        { error: 'Limite da empresa atingido. Tente novamente em instantes.' },
        { status: 429 },
      );
    }

    // Validação centralizada via Zod + allowlist de URLs
    const raw = await request.json().catch(() => null);
    const { data: body, error: validationError } = parseBody(redeemSchema, raw);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const { rewardId, productUrl, pointsCost, productTitle } = body;
    const db = getTenantDb(tenantId);

    // Lock distribuído para prevenir double-spend em resgates concorrentes.
    const lockKey = `lock:redeem:${tenantId}:${userId}`;
    const lockAcquired = await acquireLock(lockKey, 10);
    if (!lockAcquired) {
      return NextResponse.json({ error: 'Resgate já em andamento. Aguarde.' }, { status: 429 });
    }

    try {
      // Fluxo 1: Resgate de recompensa cadastrada (rewardId)
      if (rewardId) {
        return await handleCatalogRewardRedemption(request, db, tenantId, userId, rewardId, lockKey);
      }

      // Fluxo 2: Resgate direto de produto Lomadee (productUrl + pointsCost)
      if (productUrl && typeof pointsCost === 'number' && pointsCost > 0) {
        return await handleLomadeeProductRedemption(request, db, tenantId, userId, productUrl, pointsCost, productTitle, lockKey);
      }

      // Fluxo 3: Geração de link afiliado sem custo (navegação/browse)
      if (productUrl) {
        const affiliateUrl = await createLomadeeTrackedLink(productUrl, `browse_${randomUUID()}`);
        return NextResponse.json({ success: true, affiliateUrl });
      }

      return NextResponse.json({ error: 'Requisição inválida.' }, { status: 400 });
    } catch (error) {
      if (error instanceof RedeemError) {
        if (error.code === 'INSUFFICIENT_BALANCE') {
          return NextResponse.json({
            error: error.message,
            missing: error.missing,
          }, { status: 400 });
        }
        if (error.code === 'USER_NOT_FOUND') {
          return NextResponse.json({ error: error.message }, { status: 404 });
        }
        if (error.code === 'REWARD_NOT_FOUND') {
          return NextResponse.json({ error: error.message }, { status: 404 });
        }
      }
      throw error;
    } finally {
      await releaseLock(lockKey);
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'Não autenticado.') {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }
    console.error('POST /api/rewards/redeem:', error);
    return NextResponse.json({ error: 'Falha interna no servidor.' }, { status: 500 });
  }
}

async function handleCatalogRewardRedemption(
  request: Request,
  db: any,
  tenantId: string,
  userId: string,
  rewardId: string,
  lockKey: string,
) {
  const reward = await db.reward.findFirst({ where: { id: rewardId } });

  if (!reward || !reward.isActive) {
    throw new RedeemError('Recompensa indisponível ou inativa.', 'REWARD_NOT_FOUND');
  }

  // Valida URL se for link customizado
  if (reward.originalUrl) {
    const check = validateAffiliateUrl(reward.originalUrl);
    if (!check.valid) {
      throw new RedeemError(`URL da recompensa inválida: ${check.reason}`, 'INVALID_URL');
    }
  }

  // Transação atômica: débito de saldo + ledger + criação do resgate
  const result = await db.$transaction(async (tx: typeof db) => {
    const user = await tx.user.findFirst({ where: { id: userId } });
    if (!user) {
      throw new RedeemError('Usuário não encontrado.', 'USER_NOT_FOUND');
    }
    if (user.pointsBalance < reward.pricePoints) {
      const missing = reward.pricePoints - user.pointsBalance;
      throw new RedeemError('Saldo insuficiente.', 'INSUFFICIENT_BALANCE', missing);
    }

    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: { pointsBalance: { decrement: reward.pricePoints } },
    });

    await tx.pointsLedger.create({
      data: {
        userId,
        tenantId,
        type: 'loss',
        pointsAmount: reward.pricePoints,
        description: `Resgate: ${reward.title}`,
      },
    });

    // Gera trackingSubId único para atribuição de comissão
    const trackingSubId = `ptfy_${tenantId.slice(0, 8)}_${userId.slice(0, 8)}_${rewardId.slice(0, 8)}_${Date.now().toString(36)}`;

    // Cria link afiliado com tracking
    let affiliateLink = reward.affiliateUrl || reward.originalUrl;
    if (reward.partner === 'LOMADEE' && reward.originalUrl) {
      try {
        affiliateLink = await createLomadeeTrackedLink(reward.originalUrl, trackingSubId);
      } catch (e) {
        console.warn('Failed to create Lomadee tracked link, using original:', e);
      }
    }

    // Cria registro de resgate com status PENDING
    const redemption = await tx.redemption.create({
      data: {
        tenantId,
        userId,
        rewardId: reward.id,
        pointsDebited: reward.pricePoints,
        trackingSubId,
        affiliateLink,
        status: 'PENDING',
      },
    });

    return { updatedUser, redemption, reward, trackingSubId, affiliateLink };
  });

  const meta = extractRequestMeta(request);
  await logAudit({
    tenantId,
    userId,
    action: 'REWARD_REDEEMED',
    entity: 'Reward',
    entityId: reward.id,
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
    oldValue: { pointsBalance: result.updatedUser.pointsBalance + reward.pricePoints },
    newValue: { pointsBalance: result.updatedUser.pointsBalance, rewardId, rewardTitle: reward.title },
  });

  // Notificação não-bloqueante
  notifyRewardRedeemed({
    tenantId,
    userId,
    rewardTitle: reward.title,
    pointsSpent: reward.pricePoints,
    link: result.affiliateLink,
  });

  return NextResponse.json({
    success: true,
    message: 'Resgate concluído com sucesso!',
    newBalance: result.updatedUser.pointsBalance,
    affiliateUrl: result.affiliateLink,
    redemptionId: result.redemption.id,
    trackingSubId: result.trackingSubId,
  });
}

async function handleLomadeeProductRedemption(
  request: Request,
  db: any,
  tenantId: string,
  userId: string,
  productUrl: string,
  pointsCost: number,
  productTitle: string | undefined,
  lockKey: string,
) {
  const sanitizedTitle = sanitizeAiText(String(productTitle ?? productUrl).slice(0, 200));

  const result = await db.$transaction(async (tx: typeof db) => {
    const user = await tx.user.findFirst({ where: { id: userId } });
    if (!user) {
      throw new RedeemError('Usuário não encontrado.', 'USER_NOT_FOUND');
    }
    if (user.pointsBalance < pointsCost) {
      const missing = pointsCost - user.pointsBalance;
      throw new RedeemError('Saldo insuficiente.', 'INSUFFICIENT_BALANCE', missing);
    }

    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: { pointsBalance: { decrement: pointsCost } },
    });

    await tx.pointsLedger.create({
      data: {
        userId,
        tenantId,
        type: 'loss',
        pointsAmount: pointsCost,
        description: `Resgate Lomadee: ${sanitizedTitle}`,
      },
    });

    // Gera trackingSubId único para produto Lomadee
    const trackingSubId = `ptfy_lomadee_${tenantId.slice(0, 8)}_${userId.slice(0, 8)}_${Date.now().toString(36)}`;

    // Cria link afiliado com tracking Lomadee
    let affiliateLink = productUrl;
    try {
      affiliateLink = await createLomadeeTrackedLink(productUrl, trackingSubId);
    } catch (e) {
      console.warn('Failed to create Lomadee tracked link for product, using original:', e);
    }

    // Cria registro de resgate
    const redemption = await tx.redemption.create({
      data: {
        tenantId,
        userId,
        rewardId: 'lomadee-product', // ID virtual para produtos diretos
        pointsDebited: pointsCost,
        trackingSubId,
        affiliateLink,
        status: 'PENDING',
      },
    });

    return { updatedUser, redemption, trackingSubId, affiliateLink, sanitizedTitle };
  });

  return NextResponse.json({
    success: true,
    message: 'Resgate concluído!',
    newBalance: result.updatedUser.pointsBalance,
    affiliateUrl: result.affiliateLink,
    redemptionId: result.redemption.id,
    trackingSubId: result.trackingSubId,
  });
}