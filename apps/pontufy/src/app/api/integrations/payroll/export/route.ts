import { NextResponse } from 'next/server';
import { getSessionContext } from '@/backend/session';
import { getTenantDb } from '@/backend/db';
import { sanitizeCsvField } from '@/lib/csv-sanitizer';

export async function GET() {
  try {
    const { tenantId, role } = await getSessionContext();

    if (role !== 'admin_rh') {
      return NextResponse.json({ error: 'Acesso Restrito: Apenas Gestores de RH.' }, { status: 403 });
    }

    const db = getTenantDb(tenantId);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const redemptions = await db.pointsLedger.findMany({
      where: {
        type: 'loss',
        timestamp: {
          gte: startOfMonth
        }
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    let csvContent = 'Data,Funcionario,Email,Descricao_Beneficio,Pontos_Deduzidos\n';

    for (const record of redemptions) {
      const date = sanitizeCsvField(record.timestamp.toISOString());
      const name = sanitizeCsvField(record.user.name);
      const email = sanitizeCsvField(record.user.email);
      const description = sanitizeCsvField(record.description);
      const points = sanitizeCsvField(record.pointsAmount);

      csvContent += `${date},${name},${email},${description},${points}\n`;
    }

    const headers = new Headers();
    headers.set('Content-Type', 'text/csv; charset=utf-8');
    headers.set('Content-Disposition', `attachment; filename="folha_beneficios_${tenantId}.csv"`);

    return new NextResponse(csvContent, { status: 200, headers });

  } catch (error) {
    if (error instanceof Error && error.message === 'Não autenticado.') {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }
    console.error('[PAYROLL EXPORT] Erro na geração da folha:', error);
    return NextResponse.json({ error: 'Falha interna ao gerar arquivo da folha.' }, { status: 500 });
  }
}