import { auth } from '@/auth';
import { prisma } from '@/backend/db';
import { getRedis } from '@/lib/redis';

export async function getSessionContext() {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Não autenticado.');
  }

  // 7.1 — Verificação ativa de status em CADA requisição autenticada:
  // usuário removido → 401; tenant suspenso/cancelado → 401. O JWT sozinho
  // não prova nada além de ter sido emitido no passado.
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, tenantId: true, role: true },
  });

  if (!user) {
    throw new Error('Conta não encontrada.');
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: user.tenantId },
    select: { contractStatus: true, subscriptionStatus: true },
  });

  const tenantBlocked =
    !tenant ||
    tenant.contractStatus === 'suspended' ||
    tenant.contractStatus === 'cancelled' ||
    tenant.subscriptionStatus === 'canceled';

  if (tenantBlocked) {
    throw new Error('Conta da empresa inativa.');
  }

  return {
    userId: user.id,
    tenantId: user.tenantId,
    role: user.role,
  };
}

// 7.2 — Política opcional por tenant (flag em Redis, sem migration no banco).
export async function setSingleSessionPolicy(tenantId: string, enabled: boolean): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.set(`single-session:${tenantId}`, enabled ? 1 : 0);
}