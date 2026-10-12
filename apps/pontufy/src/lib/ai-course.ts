import type { getTenantDb } from '@/backend/db';

/**
 * Curso escrito por IA de fato. aiCreditsSpent > 0 também vale para o rascunho
 * do modelo padrão (quando nenhum provedor respondeu); o provedor real fica na
 * auditoria COURSE_GENERATED ("local:…" = modelo, sem IA).
 */
export async function isAiWritten(
  db: ReturnType<typeof getTenantDb>,
  course: { id: string; aiCreditsSpent: number },
): Promise<boolean> {
  if (course.aiCreditsSpent <= 0) return false;
  const generated = await db.auditLog.findFirst({
    where: { entity: 'Course', entityId: course.id, action: 'COURSE_GENERATED' },
    orderBy: { createdAt: 'desc' },
    select: { newValue: true },
  });
  const provider = (generated?.newValue as { provider?: string } | null)?.provider ?? '';
  return !provider.startsWith('local:');
}
