import { getTenantDb } from '@/backend/db';

/**
 * Velocity Anti-Fraud Middleware
 * Throttles unnatural lesson completion speeds to prevent automated farming.
 * 
 * Uses getTenantDb which automatically injects tenantId into all queries.
 * The tenantId in the where clause is redundant but harmless — the interceptor
 * will override it with the session's tenantId for Zero Trust enforcement.
 */
export async function checkVelocityLimit(
  userId: string,
  tenantId: string,
  minSecondsThreshold: number = 20
): Promise<{ allowed: boolean; reason?: string }> {
  const db = getTenantDb(tenantId);

  // Fetch the most recent point gain for this user
  // Note: tenantId in where is auto-injected by getTenantDb interceptor
  const lastGain = await db.pointsLedger.findFirst({
    where: {
      userId,
      type: 'gain'
    },
    orderBy: {
      timestamp: 'desc'
    }
  });

  if (!lastGain) {
    return { allowed: true }; // First completion, always allowed
  }

  const now = new Date();
  const timeDiffSeconds = (now.getTime() - lastGain.timestamp.getTime()) / 1000;

  if (timeDiffSeconds < minSecondsThreshold) {
    console.warn(`[ANTI-FRAUD] User ${userId} attempted to farm points too quickly. Allowed margin: ${minSecondsThreshold}s, Actual: ${timeDiffSeconds.toFixed(1)}s`);
    return { 
      allowed: false, 
      reason: `Velocidade bloqueada. Aguarde ${Math.ceil(minSecondsThreshold - timeDiffSeconds)} segundos antes de concluir outra aula.` 
    };
  }

  return { allowed: true };
}
