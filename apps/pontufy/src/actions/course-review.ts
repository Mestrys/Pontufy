'use server';

// Revisão humana de cursos gerados por IA: o RH lê cada aula, corrige o
// texto ou pede uma nova versão de uma aula à IA antes de publicar.

import { z } from 'zod';
import { LESSON_ORDER } from '@/lib/lesson-order';
import { isAiWritten } from '@/lib/ai-course';
import { generateObject } from 'ai';
import { revalidatePath } from 'next/cache';

import { auth } from '@/auth';
import { getTenantDb } from '@/backend/db';
import { rateLimitCheck } from '@/lib/redis';
import { buildProviderChain } from '@/lib/ai-providers';
import { sanitizeAiHtml, sanitizeAiText } from '@/lib/validations/security';
import { logAudit } from '@/lib/audit';
import { lessonSchema } from '@/schemas/course-schema';
import { CONTENT_TYPES, CONTENT_TYPE_LABELS } from '@/lib/course-types';
import type { ContentType } from '@/lib/course-types';
import { SYSTEM_PROMPT, FORMAT_PROMPTS, LESSON_CONTENT_DESCRIPTIONS } from '@/lib/course-prompts';

export interface ReviewLesson {
  id: string;
  title: string;
  content: string;
  points: number;
}

export interface ReviewQuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export interface ReviewCourse {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'published';
  aiGenerated: boolean;
  contentType: ContentType;
  lessons: ReviewLesson[];
  quiz: ReviewQuizQuestion[];
}

type Result<T> = ({ success: true } & T) | { success: false; error: string };

const MAX_LESSON_REGENERATIONS_PER_DAY = 30;

async function requireHr() {
  const session = await auth();
  if (!session?.user) return { ok: false, error: 'Sessão expirada. Entre novamente.' } as const;
  if (session.user.role !== 'admin_rh') return { ok: false, error: 'Apenas a gestão de RH pode revisar cursos.' } as const;
  const tenantId = session.user.tenantId;
  if (!tenantId) return { ok: false, error: 'Sessão sem empresa. Entre novamente.' } as const;
  return { ok: true, tenantId, userId: session.user.id } as const;
}

/** O formato fica registrado na descrição: "… (Formato: Roteiro de Vídeo)". */
function contentTypeFromDescription(description: string | null): ContentType {
  const match = /\(Formato: ([^)]+)\)\s*$/.exec(description ?? '');
  if (!match) return 'text';
  return CONTENT_TYPES.find((t) => CONTENT_TYPE_LABELS[t] === match[1]) ?? 'text';
}

function parseQuiz(quizJson: string | null): ReviewQuizQuestion[] {
  if (!quizJson) return [];
  try {
    const modules = JSON.parse(quizJson) as Array<{ questions?: Array<{ question: string; options: Array<{ text: string } | string>; correctIndex: number; explanation?: string }> }>;
    return modules.flatMap((m) =>
      (m.questions ?? []).map((q) => ({
        question: q.question,
        options: q.options.map((o) => (typeof o === 'string' ? o : o.text)),
        correctIndex: q.correctIndex,
        explanation: q.explanation || undefined,
      })),
    );
  } catch {
    return [];
  }
}

const idSchema = z.string().min(1).max(100);

export async function getCourseForReview(courseId: string): Promise<Result<{ course: ReviewCourse }>> {
  const ctx = await requireHr();
  if (!ctx.ok) return { success: false, error: ctx.error };
  if (!idSchema.safeParse(courseId).success) return { success: false, error: 'Curso inválido.' };

  const db = getTenantDb(ctx.tenantId);
  const course = await db.course.findFirst({
    where: { id: courseId },
    include: { lessons: { orderBy: LESSON_ORDER } },
  });
  if (!course) return { success: false, error: 'Curso não encontrado.' };

  return {
    success: true,
    course: {
      id: course.id,
      title: course.title,
      description: visibleDescription(course.description),
      status: course.status === 'published' ? 'published' : 'draft',
      aiGenerated: await isAiWritten(db, course),
      contentType: contentTypeFromDescription(course.description),
      lessons: course.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        content: l.contentUrl ?? '',
        points: l.pointsAssigned,
      })),
      quiz: parseQuiz(course.quizJson),
    },
  };
}

/** Aula do curso do próprio tenant (Lesson não tem tenantId: escopo pela relação). */
async function findLesson(tenantId: string, courseId: string, lessonId: string) {
  const db = getTenantDb(tenantId);
  const course = await db.course.findFirst({ where: { id: courseId }, select: { id: true, title: true, description: true, status: true } });
  if (!course) return null;
  const lesson = await db.lesson.findFirst({ where: { id: lessonId, courseId: course.id } });
  if (!lesson) return null;
  return { db, course, lesson };
}

function revalidateCourse(courseId: string) {
  try {
    revalidatePath('/admin', 'page');
    revalidatePath(`/admin/courses/${courseId}`, 'page');
    revalidatePath('/cursos', 'page');
  } catch {}
}

const updateLessonSchema = z.object({
  courseId: idSchema,
  lessonId: idSchema,
  title: z.string().trim().min(3, 'O título precisa de pelo menos 3 caracteres.').max(160, 'Título longo demais (até 160 caracteres).'),
  content: z.string().trim().min(1, 'A aula não pode ficar vazia.').max(60000, 'Conteúdo longo demais.'),
});

export async function updateLesson(input: {
  courseId: string;
  lessonId: string;
  title: string;
  content: string;
}): Promise<Result<{ lesson: ReviewLesson }>> {
  const ctx = await requireHr();
  if (!ctx.ok) return { success: false, error: ctx.error };
  const parsed = updateLessonSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };

  const found = await findLesson(ctx.tenantId, parsed.data.courseId, parsed.data.lessonId);
  if (!found) return { success: false, error: 'Aula não encontrada.' };

  const title = sanitizeAiText(parsed.data.title);
  const content = sanitizeAiHtml(parsed.data.content);
  const updated = await found.db.lesson.update({
    where: { id: found.lesson.id },
    data: { title, contentUrl: content },
  });

  await logAudit({
    tenantId: ctx.tenantId,
    userId: ctx.userId,
    action: 'LESSON_EDITED',
    entity: 'Lesson',
    entityId: updated.id,
    oldValue: { title: found.lesson.title, length: found.lesson.contentUrl?.length ?? 0 },
    newValue: { title, length: content.length, courseId: found.course.id },
  });
  revalidateCourse(found.course.id);

  return { success: true, lesson: { id: updated.id, title: updated.title, content: updated.contentUrl ?? '', points: updated.pointsAssigned } };
}

const regenerateSchema = z.object({
  courseId: idSchema,
  lessonId: idSchema,
  instructions: z.string().trim().max(1000, 'Instruções longas demais (até 1.000 caracteres).').optional(),
});

/**
 * Gera de novo uma aula com a IA, mantendo o lugar dela no curso. Não debita
 * crédito (a pessoa está corrigindo um curso já pago), mas tem limite diário.
 * Só para rascunho: curso publicado volta a rascunho antes de trocar o conteúdo.
 */
export async function regenerateLesson(input: {
  courseId: string;
  lessonId: string;
  instructions?: string;
}): Promise<Result<{ lesson: ReviewLesson }>> {
  const ctx = await requireHr();
  if (!ctx.ok) return { success: false, error: ctx.error };
  const parsed = regenerateSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };

  const found = await findLesson(ctx.tenantId, parsed.data.courseId, parsed.data.lessonId);
  if (!found) return { success: false, error: 'Aula não encontrada.' };
  if (found.course.status === 'published') {
    return { success: false, error: 'Despublique o curso antes de gerar uma aula de novo: os colaboradores veriam a troca no meio do curso.' };
  }

  const limit = await rateLimitCheck(`ratelimit:regenerate-lesson:${ctx.tenantId}`, MAX_LESSON_REGENERATIONS_PER_DAY, 86400);
  if (!limit.allowed) {
    return { success: false, error: `Limite de ${MAX_LESSON_REGENERATIONS_PER_DAY} aulas geradas de novo por dia. Edite o texto à mão ou tente amanhã.` };
  }

  const chain = buildProviderChain();
  if (chain.length === 0) {
    return { success: false, error: 'A IA está indisponível agora. Você pode editar o texto da aula à mão.' };
  }

  const contentType = contentTypeFromDescription(found.course.description);
  const siblings = await found.db.lesson.findMany({
    where: { courseId: found.course.id },
    orderBy: LESSON_ORDER,
    select: { id: true, title: true },
  });
  const position = siblings.findIndex((l) => l.id === found.lesson.id) + 1;
  const outline = siblings.map((l, i) => `${i + 1}. ${l.title}${l.id === found.lesson.id ? '  ← reescrever esta' : ''}`).join('\n');

  const schema = lessonSchema
    .extend({ content: lessonSchema.shape.content.describe(LESSON_CONTENT_DESCRIPTIONS[contentType]) })
    .omit({ order: true });

  const prompt = `Curso: ${found.course.title}
Descrição: ${found.course.description ?? ''}
Estrutura do curso:
${outline}

Reescreva SOMENTE a aula ${position} ("${found.lesson.title}"), mantendo o tema dela e o encaixe com as aulas vizinhas.
Texto atual da aula (para referência; não copie):
${(found.lesson.contentUrl ?? '').slice(0, 8000)}
${parsed.data.instructions ? `\nPedido do RH para a nova versão: ${parsed.data.instructions}` : ''}`;

  const system = `${SYSTEM_PROMPT}\n\n${FORMAT_PROMPTS[contentType]}\n\nNesta chamada, gere UMA aula só, no schema pedido.`;

  let generated: z.infer<typeof schema> | null = null;
  let provider = '';
  for (const attempt of chain) {
    try {
      const { object } = await generateObject({
        model: attempt.build(),
        schema,
        system,
        prompt,
        temperature: 0.7,
        maxRetries: 1,
        maxOutputTokens: 4096,
      });
      generated = object;
      provider = attempt.name;
      break;
    } catch (err) {
      console.error(`[course-review] Falha em ${attempt.name}:`, err instanceof Error ? err.message : err);
    }
  }
  if (!generated) {
    return { success: false, error: 'A IA não respondeu agora. Tente de novo em alguns minutos ou edite o texto à mão.' };
  }

  const title = sanitizeAiText(generated.title).slice(0, 160);
  const content = sanitizeAiHtml(generated.content);
  const updated = await found.db.lesson.update({
    where: { id: found.lesson.id },
    data: { title, contentUrl: content },
  });

  await logAudit({
    tenantId: ctx.tenantId,
    userId: ctx.userId,
    action: 'LESSON_REGENERATED',
    entity: 'Lesson',
    entityId: updated.id,
    oldValue: { title: found.lesson.title },
    newValue: { title, provider, courseId: found.course.id, instructions: parsed.data.instructions ?? null },
  });
  revalidateCourse(found.course.id);

  return { success: true, lesson: { id: updated.id, title: updated.title, content: updated.contentUrl ?? '', points: updated.pointsAssigned } };
}

const courseInfoSchema = z.object({
  courseId: idSchema,
  title: z.string().trim().min(5, 'O título precisa de pelo menos 5 caracteres.').max(160, 'Título longo demais (até 160 caracteres).'),
  description: z.string().trim().max(2000, 'Descrição longa demais (até 2.000 caracteres).'),
});

const FORMAT_SUFFIX = /\s*\(Formato: [^)]+\)\s*$/;

/** Descrição sem o sufixo técnico "(Formato: …)", para exibir e editar. */
function visibleDescription(description: string | null): string {
  return (description ?? '').replace(FORMAT_SUFFIX, '');
}

export async function updateCourseInfo(input: {
  courseId: string;
  title: string;
  description: string;
}): Promise<Result<{ title: string; description: string }>> {
  const ctx = await requireHr();
  if (!ctx.ok) return { success: false, error: ctx.error };
  const parsed = courseInfoSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };

  const db = getTenantDb(ctx.tenantId);
  const course = await db.course.findFirst({ where: { id: parsed.data.courseId }, select: { id: true, title: true, description: true } });
  if (!course) return { success: false, error: 'Curso não encontrado.' };

  // Mantém o formato registrado no fim da descrição (usado ao gerar uma aula de novo).
  const suffix = FORMAT_SUFFIX.exec(course.description ?? '')?.[0] ?? '';
  const title = sanitizeAiText(parsed.data.title);
  const description = sanitizeAiText(parsed.data.description);
  await db.course.updateMany({ where: { id: course.id }, data: { title, description: `${description}${suffix}` } });

  await logAudit({
    tenantId: ctx.tenantId,
    userId: ctx.userId,
    action: 'COURSE_EDITED',
    entity: 'Course',
    entityId: course.id,
    oldValue: { title: course.title },
    newValue: { title },
  });
  revalidateCourse(course.id);

  return { success: true, title, description };
}
