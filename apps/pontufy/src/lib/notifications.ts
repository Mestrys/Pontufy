import { getTenantDb } from '@/backend/db';
import { broadcastToTenant } from '@/app/api/notifications/stream/route';

export type NotificationType =
  | 'POINTS_EARNED'
  | 'REWARD_REDEEMED'
  | 'COURSE_ASSIGNED'
  | 'LEVEL_UP'
  | 'SYSTEM';

export interface NotificationPayload {
  tenantId: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Cria uma notificação persistida e propaga em tempo real (SSE) para o tenant.
 *
 * Resiliência / Desacoplamento:
 *  - A função NUNCA lança erro — qualquer falha (banco, redis) é absorvida
 *    e logada, para não quebrar a rota principal que a dispara.
 *  - Os chamadores DEVEM usar fire-and-forget (`void dispatchNotification(...)`)
 *    para não bloquear a resposta da rota.
 */
export async function dispatchNotification(
  payload: NotificationPayload,
): Promise<void> {
  try {
    const db = getTenantDb(payload.tenantId);
    await db.notification.create({
      data: {
        tenantId: payload.tenantId,
        userId: payload.userId,
        title: payload.title,
        message: payload.message,
        type: payload.type,
        link: payload.link ?? null,
        metadata: payload.metadata ?? undefined,
      },
    });

    broadcastToTenant(payload.tenantId, 'notification', {
      userId: payload.userId,
      title: payload.title,
      message: payload.message,
      type: payload.type,
      link: payload.link ?? null,
    });
  } catch (err) {
    console.error('Falha ao despachar notificação (não-bloqueante):', err);
  }
}

export function notifyLessonCompleted(params: {
  tenantId: string;
  userId: string;
  lessonTitle: string;
  courseTitle: string;
  points: number;
  link?: string;
}): void {
  void dispatchNotification({
    tenantId: params.tenantId,
    userId: params.userId,
    type: 'POINTS_EARNED',
    title: 'Aula concluída!',
    message: `Você completou "${params.lessonTitle}" em "${params.courseTitle}" e ganhou +${params.points} pontos.`,
    link: params.link,
    metadata: { lessonTitle: params.lessonTitle, courseTitle: params.courseTitle, points: params.points },
  });
}

export function notifyRewardRedeemed(params: {
  tenantId: string;
  userId: string;
  rewardTitle: string;
  pointsSpent: number;
  link?: string;
}): void {
  void dispatchNotification({
    tenantId: params.tenantId,
    userId: params.userId,
    type: 'REWARD_REDEEMED',
    title: 'Recompensa resgatada',
    message: `Você resgatou "${params.rewardTitle}" por ${params.pointsSpent} pontos. Aproveite!`,
    link: params.link,
    metadata: { rewardTitle: params.rewardTitle, pointsSpent: params.pointsSpent },
  });
}

export function notifyCourseAssigned(params: {
  tenantId: string;
  userId: string;
  courseTitle: string;
  link?: string;
}): void {
  void dispatchNotification({
    tenantId: params.tenantId,
    userId: params.userId,
    type: 'COURSE_ASSIGNED',
    title: 'Novo curso disponível',
    message: `O curso "${params.courseTitle}" foi atribuído a você. Comece a aprender!`,
    link: params.link,
    metadata: { courseTitle: params.courseTitle },
  });
}

export function notifyLevelUp(params: {
  tenantId: string;
  userId: string;
  tierName: string;
  pointsBalance: number;
  link?: string;
}): void {
  void dispatchNotification({
    tenantId: params.tenantId,
    userId: params.userId,
    type: 'LEVEL_UP',
    title: 'Você subiu de nível!',
    message: `Parabéns, você agora é nível "${params.tierName}" com ${params.pointsBalance} pontos.`,
    link: params.link,
    metadata: { tierName: params.tierName, pointsBalance: params.pointsBalance },
  });
}

export function notifySystem(params: {
  tenantId: string;
  userId: string;
  title: string;
  message: string;
  link?: string;
}): void {
  void dispatchNotification({
    tenantId: params.tenantId,
    userId: params.userId,
    type: 'SYSTEM',
    title: params.title,
    message: params.message,
    link: params.link,
  });
}