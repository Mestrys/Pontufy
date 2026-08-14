import { NextResponse } from 'next/server';
import { getSessionContext } from '@/backend/session';
import { getTenantDb } from '@/backend/db';
import { acquireLock, releaseLock } from '@/lib/redis/mutex';
import { generateAffiliateUrl, type Partner } from '@/lib/affiliate-engine';
import { logAudit, extractRequestMeta } from '@/lib/audit';
import { notifyRewardRedeemed } from '@/lib/notifications';

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
    const { tenantId, userId } = await getSessionContext();
    const body = await request.json();
    const { rewardId, productUrl } = body;

    if (!rewardId && !productUrl) {
      return NextResponse.json({ error: 'rewardId ou productUrl é obrigatório.' }, { status: 400 });
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
      const pointsCost = body.pointsCost || 0;

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
                description: `Resgate Lomadee: ${body.productTitle || productUrl}`,
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