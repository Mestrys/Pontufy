import { getTenantDb } from '@/backend/db';
import type { Prisma } from '@prisma/client';

// Trilha de auditoria IMUTÁVEL (append-only): esta tabela aceita exclusivamente
// inserções. É PROIBIDO implementar update/delete sobre AuditLog — a integridade
// do registro é a base das obrigações SOC2 / LGPD / GDPR.
//
// Toda mutação sensível (admin_rh ou super_admin) DEVE registrar entity,
// entityId e os valores antigo/novo (JSON) para reconstituição forense.

export interface AuditEntry {
  tenantId: string;
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    const db = getTenantDb(entry.tenantId);
    await db.auditLog.create({
      data: {
        tenantId: entry.tenantId,
        userId: entry.userId || null,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId || null,
        oldValue: (entry.oldValue ?? undefined) as Prisma.InputJsonValue,
        newValue: (entry.newValue ?? undefined) as Prisma.InputJsonValue,
        ipAddress: entry.ipAddress || null,
        userAgent: entry.userAgent || null,
      },
    });
  } catch (error) {
    // Auditoria nunca derruba a operação principal.
    console.error('[AUDIT] Failed to write audit log:', error);
  }
}

export function extractRequestMeta(request: Request) {
  return {
    ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip'),
    userAgent: request.headers.get('user-agent'),
  };
}