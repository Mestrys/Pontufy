// ═══════════════════════════════════════════════════════════════════════
// Pontufy — Endpoint Postback: Atribuição de Comissões (Server-Side)
// ═══════════════════════════════════════════════════════════════════════
//
// Responsabilidade:
//   Receber notificações server-to-server (Postback URLs) das redes
//   afiliadas informando que uma venda/conversão ocorreu.
//
// Vantagem do modelo Postback:
//   O rastreamento funciona mesmo com bloqueadores de anúncios, firewalls
//   corporativos, e extensões de privacidade do lado do colaborador,
//   porque a chamada é feita *server → server*, sem depender do browser.
//
// Segurança:
//   1. HMAC-SHA256 de validação para autenticar a origem da rede.
//   2. Verificação de ownership do trackingId (Zero Trust por tenant).
//   3. Idempotência via orderId para evitar dupla contabilização.
// ═══════════════════════════════════════════════════════════════════════

import type {
  AffiliateNetwork,
  CommissionEvent,
  CommissionStatus,
} from './types';
import { createLogger } from './logger';
import { getTenantDb } from './db';
import {
  resolveTenant,
  getAffiliateCredential,
  validateTrackingOwnership,
  TenantNotFoundError,
  UnauthorizedTenantAccessError,
} from './tenant';
import { notifySystem } from '@/lib/notifications';

// ────────────────────── Validação de assinatura ─────────────────────

/**
 * Verifica o HMAC-SHA256 enviado pela rede afiliada no header.
 *
 * Em produção, use a Web Crypto API (disponível em Vercel Edge,
 * Cloudflare Workers e Node 18+).
 */
async function verifySignature(
  payload: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  // ── Implementação com Web Crypto API ──
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const expected = Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return expected === signature;
}

// ──────────────────────── Persistência de comissão ─────────────────────────

/**
 * Persiste o evento de comissão no banco (Zero Trust via getTenantDb).
 *
 * Idempotência é garantida pela constraint UNIQUE(tenantId, network, orderId):
 * o interceptor injeta tenantId, e uma tentativa duplicada retorna a
 * Commission já existente sem duplo crédito.
 *
 * Quando a rede reporta status 'approved' com comissão > 0, o crédito de
 * pontos (PointsLedger gain + incremento do saldo) acontece na MESMA
 * $transaction da persistência — atômico.
 */
export async function persistCommission(
  event: CommissionEvent,
): Promise<{ commissionId: string; alreadyProcessed: boolean }> {
  const db = getTenantDb(event.tenantId);

  // findFirst (não findUnique): o interceptor injeta tenantId no where,
  // e findUnique rejeita campos extras.
  const existing = await db.commission.findFirst({
    where: { orderId: event.orderId, network: event.network },
  });
  if (existing) {
    return { commissionId: existing.id, alreadyProcessed: true };
  }

  const pointsAwarded =
    event.status === 'approved' && event.commissionValue > 0
      ? Math.round(event.commissionValue * 10)
      : 0;

  const commission = await db.$transaction(async (tx) => {
    const created = await tx.commission.create({
      data: {
        id: event.id,
        tenantId: event.tenantId,
        network: event.network,
        trackingId: event.trackingId,
        userId: event.userId,
        orderId: event.orderId,
        orderValue: event.orderValue,
        commissionValue: event.commissionValue,
        currency: event.currency,
        status: event.status,
        pointsAwarded,
        receivedAt: new Date(event.receivedAt),
      },
    });

    if (pointsAwarded > 0) {
      await tx.pointsLedger.create({
        data: {
          userId: event.userId,
          tenantId: event.tenantId,
          type: 'gain',
          pointsAmount: pointsAwarded,
          description: `Comissão ${event.network} - Pedido ${event.orderId}`,
        },
      });
      await tx.user.update({
        where: { id: event.userId },
        data: { pointsBalance: { increment: pointsAwarded } },
      });
    }

    return created;
  });

  return { commissionId: commission.id, alreadyProcessed: false };
}

// ═══════════════════════════════ HANDLER ═════════════════════════════

/**
 * Payload esperado no POST body enviado pela rede afiliada.
 */
export interface PostbackPayload {
  network:         AffiliateNetwork;
  tenantId:        string;
  trackingId:      string;  // formato: {tenantId}:{userId}:{ts}
  orderId:         string;
  orderValue:      number;
  commissionValue: number;
  currency:        string;
  status:          CommissionStatus;
}

export interface PostbackResponse {
  success: boolean;
  message: string;
  commissionId?: string;
}

/**
 * Função principal do endpoint de postback.
 *
 * Integra-se como:
 *   - Next.js API Route   → app/api/postback/route.ts
 *   - Vercel Serverless   → api/postback.ts
 *   - AWS Lambda          → exports.handler
 */
export async function handlePostback(
  payload: PostbackPayload,
  signatureHeader: string | null,
): Promise<PostbackResponse> {
  // ── 1. Resolver tenant ────────────────────────────────────────────
  let log;
  try {
    const tenant = resolveTenant(payload.tenantId);
    log = createLogger(tenant.tenantId, 'postback-receiver');

    // ── 2. Validar assinatura HMAC (autenticação da rede) ───────────
    const cred = getAffiliateCredential(payload.tenantId, payload.network);
    const isValid = signatureHeader
      ? await verifySignature(JSON.stringify(payload), signatureHeader, cred.apiSecret)
      : false;

    if (!isValid) {
      log.warn('Assinatura HMAC inválida ou ausente.', {
        network: payload.network,
        orderId: payload.orderId,
      });
      return { success: false, message: 'INVALID_SIGNATURE' };
    }

    // ── 3. Verificar ownership do trackingId (Zero Trust) ───────────
    validateTrackingOwnership(payload.trackingId, payload.tenantId);

    // ── 4. Extrair userId do trackingId ─────────────────────────────
    const userId = payload.trackingId.split(':')[1];
    if (!userId) {
      log.error('trackingId malformado — userId ausente.', { trackingId: payload.trackingId });
      return { success: false, message: 'MALFORMED_TRACKING_ID' };
    }

    // ── 5. Persistir evento de comissão (idempotente + atômico) ─────
    const event: CommissionEvent = {
      id:              `comm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      tenantId:        tenant.tenantId,
      network:         payload.network,
      trackingId:      payload.trackingId,
      userId,
      orderId:         payload.orderId,
      orderValue:      payload.orderValue,
      commissionValue: payload.commissionValue,
      currency:        payload.currency,
      status:          payload.status,
      receivedAt:      new Date().toISOString(),
    };

    const { commissionId, alreadyProcessed } = await persistCommission(event);

    if (alreadyProcessed) {
      log.warn('Order já processada (idempotência).', { orderId: payload.orderId });
      return { success: true, message: 'ALREADY_PROCESSED', commissionId };
    }

    // Non-blocking: aviso de crédito de comissão quando aprovado.
    const commissionPoints =
      event.status === 'approved' && event.commissionValue > 0
        ? Math.round(event.commissionValue * 10)
        : 0;
    if (commissionPoints > 0) {
      notifySystem({
        tenantId: tenant.tenantId,
        userId,
        title: 'Comissão creditada',
        message: `Sua comissão de ${payload.network} (pedido ${payload.orderId}) rendeu +${commissionPoints} pontos.`,
      });
    }

    log.info('Comissão registrada com sucesso.', {
      commissionId,
      orderId: payload.orderId,
      commissionValue: payload.commissionValue,
    });

    return { success: true, message: 'OK', commissionId };

  } catch (err: unknown) {
    // ── Tratamento cirúrgico de erros de domínio ────────────────────
    if (err instanceof TenantNotFoundError) {
      return { success: false, message: 'TENANT_NOT_FOUND' };
    }
    if (err instanceof UnauthorizedTenantAccessError) {
      log?.error('Violação de escopo detectada!', { detail: err.message });
      return { success: false, message: 'SCOPE_VIOLATION' };
    }

    // Erro genérico — nunca vaza stack trace para o chamador
    console.error(JSON.stringify({
      action: 'POSTBACK_UNHANDLED_ERROR',
      error: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    }));
    return { success: false, message: 'INTERNAL_ERROR' };
  }
}
