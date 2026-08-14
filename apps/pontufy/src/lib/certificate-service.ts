import { randomUUID } from 'node:crypto';
import { getTenantDb } from '@/backend/db';
import { generateCertificatePdf } from './certificate-generator';

// Serviço compartilhado de emissão de certificados (usado por
// POST /api/certificates e POST /api/certificates/generate).
// Zero Trust: tenantId/userId vêm estritamente da sessão; todo acesso passa
// pelo interceptor getTenantDb. Deduplicação garantida por @@unique([userId, courseId]).

export class CertificateError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export interface IssueCertificateResult {
  buffer: Buffer<ArrayBuffer>;
  filename: string;
}

export async function issueCertificate(
  tenantId: string,
  userId: string,
  courseId: string,
): Promise<IssueCertificateResult> {
  const db = getTenantDb(tenantId);

  const course = await db.course.findFirst({
    where: { id: courseId, status: 'published' },
    include: { lessons: { select: { id: true, title: true } } },
  });
  if (!course) throw new CertificateError('Curso não encontrado.', 404);

  const lessonIds = course.lessons.map((l) => l.id);

  // 100% das aulas precisam de LessonCompletion registrada.
  const completions = await db.lessonCompletion.findMany({
    where: { userId, lessonId: { in: lessonIds } },
    select: { lessonId: true, createdAt: true },
  });
  if (completions.length < lessonIds.length) {
    throw new CertificateError(
      `Curso não concluído. ${completions.length}/${lessonIds.length} aulas completas.`,
      400,
    );
  }

  // Quiz final aprovado (>= 70%, gravado server-side). Curso sem quizJson não exige quiz.
  if (course.quizJson) {
    const passedAttempt = await db.quizAttempt.findFirst({
      where: { userId, courseId, passed: true },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });
    if (!passedAttempt) {
      throw new CertificateError('O quiz final ainda não foi aprovado (nota mínima de 70%).', 400);
    }
  }

  const user = await db.user.findFirst({ where: { id: userId }, select: { name: true } });
  const tenant = await db.tenant.findFirst({ where: { id: tenantId }, select: { name: true } });
  if (!user || !tenant) {
    throw new CertificateError('Dados do usuário não encontrados.', 404);
  }

  const lastCompletion = completions.reduce((latest, c) =>
    c.createdAt > latest.createdAt ? c : latest,
  );
  const completionDate = lastCompletion.createdAt.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const workloadHours = course.workloadHours > 0 ? course.workloadHours : Math.max(1, lessonIds.length);

  // Hash estável entre reemissões: reutiliza o existente quando o certificado já existe.
  const existing = await db.issuedCertificate.findFirst({
    where: { userId, courseId },
    select: { verificationHash: true },
  });
  const verificationHash = existing?.verificationHash ?? randomUUID();

  const certificate = await db.issuedCertificate.upsert({
    where: { userId_courseId: { userId, courseId } },
    update: { courseName: course.title, issuedAt: new Date(), verificationHash },
    create: { userId, tenantId, courseId, courseName: course.title, verificationHash },
  });

  const buffer = generateCertificatePdf({
    employeeName: user.name,
    courseName: course.title,
    tenantName: tenant.name,
    completionDate,
    workloadHours,
    lessonCount: lessonIds.length,
    verificationHash: certificate.verificationHash ?? verificationHash,
  });

  return {
    buffer,
    filename: `certificado-${course.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.pdf`,
  };
}