import { NextResponse } from 'next/server';
import { getSessionContext } from '@/backend/session';
import { getTenantDb } from '@/backend/db';
import { sanitizeCsvField } from '@/lib/csv-sanitizer';

interface RedemptionRow {
  id: string;
  pointsAmount: number;
  description: string;
  timestamp: Date;
  user: { name: string; email: string };
}

export async function GET(request: Request) {
  try {
    const { tenantId, role } = await getSessionContext();

    if (role !== 'admin_rh' && role !== 'super_admin') {
      return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 });
    }

    const db = getTenantDb(tenantId);

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';

    const now = new Date();
    const startOfPeriod = new Date(now);
    if (period === 'month') {
      startOfPeriod.setDate(1);
    } else if (period === 'quarter') {
      startOfPeriod.setDate(1);
      startOfPeriod.setMonth(startOfPeriod.getMonth() - 3);
    } else if (period === 'year') {
      startOfPeriod.setDate(1);
      startOfPeriod.setMonth(0);
    } else {
      startOfPeriod.setDate(1);
    }
    startOfPeriod.setHours(0, 0, 0, 0);

    const redemptions = await db.pointsLedger.findMany({
      where: {
        type: 'loss',
        timestamp: { gte: startOfPeriod },
      },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    const totalPointsDeducted = redemptions.reduce(
      (sum, record) => sum + record.pointsAmount,
      0,
    );

    const csvContent = [
      'Data,Funcionario,Email,Descricao_Beneficio,Pontos_Deduzidos',
      ...redemptions.map((record: RedemptionRow) =>
        [
          sanitizeCsvField(record.timestamp.toISOString()),
          sanitizeCsvField(record.user.name),
          sanitizeCsvField(record.user.email),
          sanitizeCsvField(record.description),
          sanitizeCsvField(record.pointsAmount),
        ].join(','),
      ),
      ['', '', '', 'TOTAL', totalPointsDeducted].map(sanitizeCsvField).join(','),
    ].join('\n');

    const periodLabel = period === 'month' ? 'mensal' : period === 'quarter' ? 'trimestral' : 'anual';

    const headers = new Headers();
    headers.set('Content-Type', 'text/csv; charset=utf-8');
    headers.set(
      'Content-Disposition',
      `attachment; filename="folha_beneficios_${periodLabel}_${tenantId}.csv"`,
    );

    return new NextResponse(csvContent, { status: 200, headers });
  } catch (error) {
    if (error instanceof Error && error.message === 'Não autenticado.') {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }
    console.error('[ADMIN PAYROLL EXPORT] Erro na geração da folha:', error);
    return NextResponse.json({ error: 'Falha interna ao gerar arquivo da folha.' }, { status: 500 });
  }
}