// File: src/app/api/postback/lomadee/route.ts
// Lomadee Postback Handler - Recebe confirmações de comissão da Lomadee
// Segurança: valida token secreto via query param; idempotência via trackingSubId

import { NextResponse } from 'next/server';
import { getRawPrisma } from '@/backend/db';
import { logAudit } from '@/lib/audit';

interface LomadeePostbackPayload {
  subId: string;           // Nosso trackingSubId
  orderId: string;         // ID do pedido na Lomadee
  orderValue: number;      // Valor total do pedido
  commissionValue: number; // Valor da comissão
  currency: string;        // Moeda (ex: 'BRL')
  status: string;          // 'CONFIRMED' | 'CANCELLED' | 'PENDING'
  partnerName: string;     // Nome do parceiro/anunciante
  partnerId: string;       // ID do parceiro na Lomadee
  clickDate: string;       // Data do clique
  conversionDate: string;  // Data da conversão
  // Campos adicionais que podem vir
  category?: string;
  productName?: string;
  quantity?: number;
}

export async function POST(request: Request) {
  try {
    // Validação de segurança: token secreto na query string
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const expectedToken = process.env.LOMADEE_POSTBACK_SECRET;

    if (!expectedToken) {
      console.error('LOMADEE_POSTBACK_SECRET não configurado no servidor');
      return NextResponse.json({ error: 'Configuração de segurança ausente' }, { status: 500 });
    }

    if (!token || token !== expectedToken) {
      console.warn('Tentativa de postback com token inválido', { ip: request.headers.get('x-forwarded-for') });
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Parse do payload
    const payload: LomadeePostbackPayload = await request.json();

    // Validação básica de campos obrigatórios
    if (!payload.subId) {
      return NextResponse.json({ error: 'Campo subId obrigatório' }, { status: 400 });
    }

    const prisma = getRawPrisma();

    // Busca o resgate pelo trackingSubId (subId)
    const redemption = await prisma.redemption.findUnique({
      where: { trackingSubId: payload.subId },
      include: { user: true, tenant: true },
    });

    if (!redemption) {
      // Log para auditoria mas não falha (pode ser postback de teste ou antigo)
      console.warn('Postback recebido para trackingSubId inexistente', { subId: payload.subId });
      return NextResponse.json({ success: true, message: 'Resgate não encontrado, ignorado' });
    }

    // Idempotência: se já processado com mesmo status, ignora
    const newStatus = mapLomadeeStatus(payload.status);
    const existingCommission = redemption.commissionValue ? Number(redemption.commissionValue) : 0;
    if (redemption.status === newStatus && existingCommission === payload.commissionValue) {
      console.log('Postback duplicado ignorado', { subId: payload.subId, status: newStatus });
      return NextResponse.json({ success: true, message: 'Já processado' });
    }

    // Atualiza o resgate dentro de transação
    const updated = await prisma.$transaction(async (tx) => {
      const updatedRedemption = await tx.redemption.update({
        where: { id: redemption.id },
        data: {
          status: newStatus,
          commissionValue: payload.commissionValue,
          postbackPayload: payload as any,
          updatedAt: new Date(),
        },
      });

      // Se comissão confirmada, registra na tabela Commission para histórico financeiro
      if (newStatus === 'CONFIRMED' && payload.commissionValue > 0) {
        await tx.commission.create({
          data: {
            tenantId: redemption.tenantId,
            network: 'LOMADEE',
            trackingId: payload.subId,
            userId: redemption.userId,
            orderId: payload.orderId,
            orderValue: payload.orderValue,
            commissionValue: payload.commissionValue,
            currency: payload.currency || 'BRL',
            status: 'approved',
            pointsAwarded: 0, // Comissão em dinheiro, não pontos
            receivedAt: new Date(payload.conversionDate || Date.now()),
          },
        });
      }

      return updatedRedemption;
    });

    // Auditoria
    await logAudit({
      tenantId: redemption.tenantId,
      userId: redemption.userId,
      action: 'REWARD_POSTBACK_RECEIVED',
      entity: 'Redemption',
      entityId: redemption.id,
      newValue: {
        trackingSubId: payload.subId,
        status: newStatus,
        commissionValue: payload.commissionValue,
        orderId: payload.orderId,
      },
    });

    console.log('Postback Lomadee processado com sucesso', {
      subId: payload.subId,
      status: newStatus,
      commission: payload.commissionValue,
    });

    return NextResponse.json({
      success: true,
      message: 'Postback processado',
      redemptionId: redemption.id,
      status: newStatus,
    });
  } catch (error) {
    console.error('Erro ao processar postback Lomadee:', error);
    // Retorna 200 para não triggerar reentrega da Lomadee (eles esperam 2xx)
    return NextResponse.json(
      { success: false, error: 'Erro interno, mas confirmado recebimento' },
      { status: 200 }
    );
  }
}

function mapLomadeeStatus(lomadeeStatus: string): string {
  const status = lomadeeStatus.toUpperCase();
  if (status === 'CONFIRMED' || status === 'APPROVED' || status === 'VALIDATED') {
    return 'CONFIRMED';
  }
  if (status === 'CANCELLED' || status === 'REJECTED' || status === 'DECLINED') {
    return 'CANCELLED';
  }
  return 'PENDING';
}

// GET endpoint para health check / verificação manual
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const expectedToken = process.env.LOMADEE_POSTBACK_SECRET;

  if (!expectedToken || token !== expectedToken) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  return NextResponse.json({
    status: 'ok',
    service: 'Lomadee Postback Handler',
    timestamp: new Date().toISOString(),
  });
}