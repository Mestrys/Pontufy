// Applies pending Prisma migrations during the build, portably and resiliently.
//
// Why a script instead of `prisma migrate deploy` inline in the build command:
//  1. Portability — it does not depend on POSIX shell `${VAR:-default}` expansion,
//     which is not guaranteed in every CI/build shell.
//  2. `directUrl` fallback — Prisma validates DIRECT_URL whenever the schema
//     references it; here it defaults to DATABASE_URL so a single connection
//     string is enough for the common case.
//  3. Fail-soft — a migration failure (e.g. DATABASE_URL is a transaction-mode
//     pooler that can't run DDL) must NOT break the deploy. We warn loudly and
//     let `next build` proceed; the operator then sets DIRECT_URL (direct
//     endpoint) or runs `npm run db:migrate` once.
import { execSync } from 'node:child_process';

// Vercel / Supabase may inject the connection strings under different names
// depending on how the integration is configured — resolve with fallbacks.
const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.SUPABASE_DATABASE_URL;

const directUrl =
  process.env.DIRECT_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.SUPABASE_DIRECT_URL;

if (!databaseUrl) {
  console.warn(
    '\n🟠 No PostgreSQL connection string is set — skipping migrations. Set ' +
      'DATABASE_URL, POSTGRES_PRISMA_URL or SUPABASE_DATABASE_URL to apply ' +
      'the schema.\n',
  );
  process.exit(0);
}

// Prisma migrate uses directUrl; fall back to the main URL when unset. Resolved
// values are passed explicitly so `prisma migrate deploy` picks them up no
// matter which variable names the platform provides.
const env = { ...process.env, DATABASE_URL: databaseUrl, DIRECT_URL: directUrl || databaseUrl };

try {
  execSync('npx prisma migrate deploy', { stdio: 'inherit', env });
} catch {
  console.warn(
    '\n🟠 `prisma migrate deploy` failed during build — continuing so the deploy ' +
      'completes.\n' +
      '   If DATABASE_URL is a transaction-mode pooler (PgBouncer / Supabase :6543 / ' +
      'Neon -pooler), migrations cannot run through it. Set DIRECT_URL to the direct ' +
      '(:5432) endpoint and redeploy, or run `npm run db:migrate` against the direct URL.\n',
  );
}

// Bootstrap idempotente: o pipeline de deploy NÃO roda o seed — se o banco está
// vazio (sem usuários), nenhum login é possível ("Email ou senha incorretos").
// Executa o seed de homologação APENAS quando a tabela de users está vazia;
// nunca sobrescreve senhas de usuários existentes.
function seedIfEmpty() {
  try {
    const count = execSync(
      `node -e "const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.user.count().then(c=>{console.log(c);return p.$disconnect()}).catch(e=>{console.error(e);process.exit(1)})"`,
      { env, stdio: ['ignore', 'pipe', 'ignore'] },
    )
      .toString()
      .trim();

    if (Number(count) > 0) {
      console.log(`🟢 ${count} usuário(s) existente(s) — seed ignorado (dados preservados).`);
      return;
    }

    console.log('🟡 Nenhum usuário encontrado — executando seed de homologação...');
    execSync('npx tsx prisma/seed.ts', { stdio: 'inherit', env });
    console.log('🟢 Seed concluído — usuários de teste disponíveis (senha 123456).');
  } catch (err) {
    // Intentionally non-fatal: never block the deploy on a seed problem.
    console.warn(`🟠 Auto-seed falhou (deploy continua): ${err?.message ?? err}`);
  }
}

seedIfEmpty();
