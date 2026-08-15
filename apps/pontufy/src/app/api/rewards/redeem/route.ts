import { NextResponse } from 'next/server';
import { getSessionContext } from '@/backend/session';
import { getTenantDb } from '@/backend/db';
import { acquireLock, releaseLock } from '@/lib/redis/mutex';
import { generateAffiliateUrl, type Partner } from '@/lib/affiliate-engine';
import { logAudit, extractRequestMeta } from '@/lib/audit';
import { notifyRewardRedeemed } from '@/lib/notifications';
import { getClientIp, ipRateLimit } from '@/lib/security/auth-guard';
import { tenantRateLimit } from '@/lib/security/rate-limit';
import { parseBody, redeemSchema } from '@/lib/validations';
import { validateAffiliateUrl, sanitizeAiText } from '@/lib/validations/security';

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
    // 6.2 — Rate limiting por IP E por tenant (resgate = desembolso de pontos).
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

    // 8.1 — Validação centralizada via Zod + allowlist de URLs (8.3)
    const raw = await request.json().catch(() => null);
    const { data: body, error: validationError } = parseBody(redeemSchema, raw);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const { rewardId, productUrl } = body;

    if (productUrl) {
      const check = validateAffiliateUrl(productUrl);
      if (!check.valid) {
        return NextResponse.json({ error: check.reason }, { status: 400 });
      }
    }

    const db = getTenantDb(tenantId);

    if (rewardId) {
      const reward = await db.reward.findFirst({ where: { id: rewardId } });

      if (!reward || !reward.isActive) {
        return NextResponse.json({ error: 'Recompensa indisponível ou inativa.' }, { status: 404 });
      }

      // Distributed lock prevents double-spend on concurrent redemptions.
      const lockKey = `lock:redeem:${tenantId}:${userId}`;
      const lockAcquired = await acquireLock(lockKey, 10);
      if (!lockAcquired) {
        return NextResponse.json({ error: 'Resgate já em andamento. Aguarde.' }, { status: 429 });
      }

      try {
        // Balance check happens INSIDE the transaction (atomic with the debit).
        const result = await db.$transaction(async (tx) => {
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

          return updatedUser;
        });

        // Generate partner-specific affiliate URL with tracking
        const affiliateUrl = generateAffiliateUrl({
          partner: reward.partnerStore as Partner,
          baseUrl: reward.affiliateLink,
          userId,
          tenantId,
          rewardId: reward.id,
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
          oldValue: { pointsBalance: result.pointsBalance + reward.pricePoints },
          newValue: { pointsBalance: result.pointsBalance, rewardId, rewardTitle: reward.title },
        });

        // Non-blocking: não atrasa nem quebra a resposta principal.
        notifyRewardRedeemed({
          tenantId,
          userId,
          rewardTitle: reward.title,
          pointsSpent: reward.pricePoints,
          link: affiliateUrl,
        });

        return NextResponse.json({
          success: true,
          message: 'Resgate concluído com sucesso!',
          newBalance: result.pointsBalance,
          affiliateUrl,
        });
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
        }
        throw error;
      } finally {
        await releaseLock(lockKey);
      }
    }

    // Lomadee direct product URL redemption (from search results)
    if (productUrl) {
      const pointsCost = typeof body.pointsCost === 'number' && body.pointsCost > 0 ? body.pointsCost : 0;
      const productTitle = sanitizeAiText(String(body.productTitle ?? productUrl).slice(0, 200));

      if (pointsCost > 0) {
        const lockKey = `lock:redeem:${tenantId}:${userId}`;
        const lockAcquired = await acquireLock(lockKey, 10);
        if (!lockAcquired) {
          return NextResponse.json({ error: 'Resgate já em andamento. Aguarde.' }, { status: 429 });
        }

        try {
          const result = await db.$transaction(async (tx) => {
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
                description: `Resgate Lomadee: ${productTitle}`,
              },
            });

            return updatedUser;
          });

          // For Lomadee products, use custom partner with base tracking
          const affiliateUrl = generateAffiliateUrl({
            partner: 'custom',
            baseUrl: productUrl,
            userId,
            tenantId,
            rewardId: 'lomadee-search',
          });

          return NextResponse.json({
            success: true,
            message: 'Resgate concluído!',
            newBalance: result.pointsBalance,
            affiliateUrl,
          });
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
          }
          throw error;
        } finally {
          await releaseLock(lockKey);
        }
      }

      // Zero-cost link generation (browsing only)
      const affiliateUrl = generateAffiliateUrl({
        partner: 'custom',
        baseUrl: productUrl,
        userId,
        tenantId,
        rewardId: 'lomadee-browse',
      });
      return NextResponse.json({ success: true, affiliateUrl });
    }

    return NextResponse.json({ error: 'Requisição inválida.' }, { status: 400 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Não autenticado.') {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }
    console.error('POST /api/rewards/redeem:', error);
    return NextResponse.json({ error: 'Falha interna no servidor.' }, { status: 500 });
  }
}