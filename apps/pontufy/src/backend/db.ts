import { PrismaClient } from '@prisma/client';

// PostgreSQL is the only production-viable engine: Vercel serverless gives each
// instance an ephemeral filesystem, so SQLite loses every write on cold start.
// The pooled Postgres endpoint must be resolvable through any of the variables
// Vercel may inject (Supabase integration exposes its own names) — resolved with
// automatic fallbacks below. DIRECT_URL (used by `prisma migrate`) points at the
// direct, unpooled endpoint.
export const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.SUPABASE_DATABASE_URL;

export const directUrl =
  process.env.DIRECT_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.SUPABASE_DIRECT_URL;

if (!databaseUrl) {
  console.error(
    '🔴 No PostgreSQL connection string is set. Configure one of: ' +
      'DATABASE_URL, POSTGRES_PRISMA_URL or SUPABASE_DATABASE_URL ' +
      '(pooled endpoint) before starting the app.',
  );
} else {
  // Log only the variable NAME that resolved — never the value (secret).
  const urlSource = process.env.DATABASE_URL
    ? 'DATABASE_URL'
    : process.env.POSTGRES_PRISMA_URL
      ? 'POSTGRES_PRISMA_URL'
      : 'SUPABASE_DATABASE_URL';
  const directSource = process.env.DIRECT_URL
    ? 'DIRECT_URL'
    : process.env.POSTGRES_URL_NON_POOLING
      ? 'POSTGRES_URL_NON_POOLING'
      : 'SUPABASE_DIRECT_URL';
  console.log(
    `🔌 db.ts: conexão pooled <- \`${urlSource}\` | direct <- \`${directSource}\``,
  );
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  ...(databaseUrl ? { datasources: { db: { url: databaseUrl } } } : {}),
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Operation classification shared across model branches.
const READ_OPS = [
  'findUnique',
  'findUniqueOrThrow',
  'findFirst',
  'findFirstOrThrow',
  'findMany',
  'count',
  'aggregate',
  'groupBy',
];
const WRITE_OPS = ['update', 'updateMany', 'delete', 'deleteMany'];
// Relation filters (e.g. `course: { is: {...} }`) are rejected by Prisma inside
// a findUnique `where`, so reads that must be relation-scoped use findFirst.
const RELATION_SAFE_READ_OPS = ['findFirst', 'findFirstOrThrow', 'findMany', 'count'];

// Models that are strictly tenant-scoped (every row belongs to exactly one tenant)
const STRICT_TENANT_MODELS = [
  'User',
  'Course',
  'PointsLedger',
  'AuditLog',
  'Invitation',
  'PasswordReset',
  'LessonCompletion',
  'QuizAttempt',
  'Commission',
  'StripeEvent',
  'IssuedCertificate',
  'Notification',
  'Skill',
  'SkillNode',
  'UserSkillProgress',
  'Battle',
  'Redemption',
] as const;

/**
 * Zero Trust Prisma extension — isolates every query to the caller's tenant.
 *
 * Per-model scoping:
 *  - Tenant: global lookup by design (callers always pass the session tenantId).
 *  - STRICT_TENANT_MODELS: strict `tenantId` equality injected into every read and write.
 *  - Reward: reads expose global (tenantId = null) + own tenant; writes are
 *    restricted to the caller's own rewards (global/foreign rewards are immutable).
 *  - Lesson: no tenantId column — reads are scoped through the parent Course
 *    relation (`course.tenantId`). findUnique cannot carry a relation filter, so
 *    tenant-sensitive lookups must use findFirst (enforced at call sites).
 *  - LessonCompletion: scoped by tenantId (injected automatically by this extension).
 *    Use findFirst (not findUnique) for tenant-sensitive lookups — findUnique rejects
 *    extra where fields injected by the interceptor.
 *  - All other models (Tenant): no tenant isolation applied.
 */
export function getTenantDb(tenantId: string) {
  if (!tenantId) throw new Error('Operação negada: tenantId não fornecido.');

  return prisma.$extends({
    query: {
      $allModels: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async $allOperations({ model, operation, args, query }: any) {
          // Tenant: global lookup (no scoping)
          if (model === 'Tenant') {
            return query(args);
          }

          // Reward: hybrid model — global (tenantId: null) visible to all,
          // own rewards read/write. Global rewards are immutable.
          if (model === 'Reward') {
            if (READ_OPS.includes(operation)) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const currentWhere = (args as any).where || {};
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (args as any).where = {
                ...currentWhere,
                OR: [{ tenantId: null }, { tenantId }],
              };
            } else if (WRITE_OPS.includes(operation)) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const currentWhere = (args as any).where || {};
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (args as any).where = { ...currentWhere, tenantId };
            } else if (['create', 'createMany'].includes(operation)) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const currentData = (args as any).data;
              if (Array.isArray(currentData)) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                currentData.forEach((d: any) => {
                  if (d.tenantId === undefined) d.tenantId = tenantId;
                });
              } else if (currentData && currentData.tenantId === undefined) {
                currentData.tenantId = tenantId;
              }
            }
            return query(args);
          }

          // Lesson: scope through the parent Course relation.
          // Relation filters are invalid inside findUnique, so only relation-safe reads get scoped.
          if (model === 'Lesson') {
            if (RELATION_SAFE_READ_OPS.includes(operation)) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const currentWhere = (args as any).where || {};
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (args as any).where = {
                ...currentWhere,
                course: { is: { tenantId } },
              };
            }
            // For writes (create/update/delete), tenant scoping is enforced at the Course level
            // via the relation. The interceptor does not inject tenantId on Lesson writes
            // because Lesson has no tenantId column.
            return query(args);
          }

          // Strict tenant isolation for all tenant-owned models.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if (STRICT_TENANT_MODELS.includes(model as any)) {
            if ([...READ_OPS, ...WRITE_OPS].includes(operation)) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const currentWhere = (args as any).where || {};
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (args as any).where = { ...currentWhere, tenantId };
            } else if (['create', 'createMany'].includes(operation)) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const currentData = (args as any).data;
              if (Array.isArray(currentData)) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                currentData.forEach((d: any) => (d.tenantId = tenantId));
              } else {
                currentData.tenantId = tenantId;
              }
            }
          }

          return query(args);
        },
      },
    },
  });
}

/**
 * Returns the raw Prisma client for administrative operations that require
 * cross-tenant access (e.g., super_admin dashboards, migrations, seeding).
 * 
 * ⚠️ USE WITH EXTREME CAUTION — bypasses all Zero Trust isolation.
 * Only permitted in:
 *   - Super admin routes (with explicit role + domain validation)
 *   - Database migrations / seeding scripts
 *   - Background jobs with explicit tenant context
 */
export function getRawPrisma(): PrismaClient {
  return prisma;
}
