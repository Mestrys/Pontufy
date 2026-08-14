import { NextResponse } from 'next/server';
import { getSessionContext } from '@/backend/session';
import { getTenantDb } from '@/backend/db';
import { sanitizeCsvField } from '@/lib/csv-sanitizer';

const MAX_LIMIT = 100;

function parsePositiveInt(value: string | null, fallback: number): number {
  const parsed = value ? Number.parseInt(value, 10) : NaN;
  if (Number.isNaN(parsed) || parsed < 1) return fallback;
  return parsed;
}

export async function GET(request: Request) {
  try {
    const { tenantId, role } = await getSessionContext();

    if (role !== 'admin_rh') {
      return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parsePositiveInt(searchParams.get('page'), 1);
    const limit = Math.min(parsePositiveInt(searchParams.get('limit'), 25), MAX_LIMIT);
    const action = searchParams.get('action')?.trim() || undefined;
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const format = searchParams.get('format');

    const where: {
      tenantId: string;
      action?: string;
      createdAt?: { gte?: Date; lte?: Date };
    } = { tenantId };

    if (action) where.action = action;

    if (from || to) {
      where.createdAt = {};
      if (from) {
        const fromDate = new Date(from);
        if (!Number.isNaN(fromDate.getTime())) where.createdAt.gte = fromDate;
      }
      if (to) {
        const toDate = new Date(to);
        if (!Number.isNaN(toDate.getTime())) where.createdAt.lte = toDate;
      }
      if (!where.createdAt.gte && !where.createdAt.lte) delete where.createdAt;
    }

    // Zero Trust: toda consulta de auditoria é estritamente do tenant do RH.
    const db = getTenantDb(tenantId);

    const [logs, total, actions] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.auditLog.count({ where }),
      db.auditLog.findMany({
        where: { tenantId },
        distinct: ['action'],
        select: { action: true },
        orderBy: { action: 'asc' },
      }),
    ]);

    if (format === 'csv') {
      const header = [
        'id',
        'created_at',
        'action',
        'entity',
        'entity_id',
        'user_id',
        'ip_address',
        'user_agent',
        'old_value',
        'new_value',
      ];
      const rows = logs.map((log) => [
        log.id,
        log.createdAt.toISOString(),
        log.action,
        log.entity,
        log.entityId ?? '',
        log.userId ?? '',
        log.ipAddress ?? '',
        log.userAgent ?? '',
        log.oldValue ? JSON.stringify(log.oldValue) : '',
        log.newValue ? JSON.stringify(log.newValue) : '',
      ]);

      const csv = [header, ...rows]
        .map((row) => row.map((cell) => sanitizeCsvField(cell)).join(','))
        .join('\n');

      const filename = `audit_logs_${tenantId}_${new Date().toISOString().slice(0, 10)}.csv`;
      return new NextResponse(`\uFEFF${csv}`, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json({
      logs: logs.map((log) => ({
        id: log.id,
        createdAt: log.createdAt.toISOString(),
        action: log.action,
        entity: log.entity,
        entityId: log.entityId,
        userId: log.userId,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        oldValue: log.oldValue ?? null,
        newValue: log.newValue ?? null,
      })),
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      availableActions: actions.map((a) => a.action),
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Não autenticado.') {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }
    console.error('GET /api/admin/audit-logs:', error);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}