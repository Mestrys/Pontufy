import { PrismaClient } from '@prisma/client';

// Cliente Prisma compartilhado pela suíte (Node, fora do App Router).
// O provider do projeto é PostgreSQL; DATABASE_URL deve estar exportada.

export const prisma = new PrismaClient();

export const SEED_PASSWORD = '123456';

/** Identificadores fixos do seed (apps/pontufy/prisma/seed.ts) */
export const SEED = {
  tenantAlphaId: 'tenant-alpha-001',
  tenantPlatformId: 'tenant-pontufy-platform',
  courseLgpdId: 'course-lgpd-001',
  lessonLgpd1: 'lesson-lgpd-001',
  lessonLgpd2: 'lesson-lgpd-002',
  lessonLgpd3: 'lesson-lgpd-003',
  rewardAmazon: 'reward-001',
  rewardIfood: 'reward-002',
  rewardLeadership: 'reward-003',
} as const;

/** Fixtures criados pelo global-setup (dedicados aos testes) */
export const FIXTURES = {
  tenantBetaSlug: 'beta-corp',
  courseIsolationAlpha: 'course-isolation-alpha-001',
  lessonIsolationAlpha: 'lesson-isolation-alpha-001',
  courseIsolationBeta: 'course-isolation-beta-001',
  lessonIsolationBeta: 'lesson-isolation-beta-001',
} as const;

/** Contas de login usadas pela suíte */
export const USERS = {
  alphaAdmin: 'admin@empresaalpha.com',
  alphaEmployee: 'joao@empresaalpha.com',
  alphaGuest: 'guest@empresaalpha.com',
  alphaVip: 'vip@empresaalpha.com',
  alphaPoor: 'poor@empresaalpha.com',
  race: 'race@empresaalpha.com',
  betaAdmin: 'admin@betacorp.com',
  betaEmployee: 'employee@betacorp.com',
  superAdmin: 'superadmin@pontufy.com',
} as const;

export async function userIdByEmail(email: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) throw new Error(`Usuário de teste não encontrado: ${email}`);
  return user.id;
}

export async function tenantIdBySlug(slug: string): Promise<string> {
  const tenant = await prisma.tenant.findUnique({ where: { slug }, select: { id: true } });
  if (!tenant) throw new Error(`Tenant de teste não encontrado: ${slug}`);
  return tenant.id;
}