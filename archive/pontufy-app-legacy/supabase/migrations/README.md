# Migrations — multi-tenancy (Fase 1/2)

**Status: revisão. Nada aqui foi aplicado contra `pontufy-production`.**

Estes arquivos introduzem o conceito de _tenant_ (empresa) no modelo de
segurança RPC/`SECURITY DEFINER` já existente. Contexto e desenho completos
estão na auditoria da sessão; resumo abaixo.

## Ordem de aplicação (obrigatória)

A ordem importa — inverter quebra o login em produção:

1. **`0001_multitenancy.sql`** — tabela `tenants`, coluna `tenant_id` em
   `app_users` e `invite_codes`, backfill de um tenant "Organização Padrão",
   constraint `role = 'MASTER_ADMIN' OR tenant_id IS NOT NULL`.
2. **`0002_tenant_scoped_functions.sql`** — ⚠️ **template**. Os corpos reais das
   funções vivem só em produção (exigem `APP_SERVER_SECRET`, não versionados).
   Antes de aplicar: obtenha o `CREATE OR REPLACE FUNCTION` atual de cada função
   por introspecção read-only e faça o merge dos blocos marcados `«TENANT»`.
3. **Só então** aplicar a fiação da app (passo abaixo). Fazer antes faz a app
   esperar `tenant_id` de funções que ainda não o devolvem → login quebra.

## Fiação da app (aplicar APÓS 0001+0002 estarem em prod)

Mudança puramente de **UX/exibição** — o `tenant_id` na sessão **nunca** é
fonte de verdade para filtro; o filtro real acontece dentro do Postgres.

- `src/lib/supabase-rpc.ts` — `DbUser` ganha `tenantId: string | null`.
- `src/auth.ts` — `auth_login`/`auth_get_user` passam a retornar `tenant_id`;
  propagar em `token.tenantId` (jwt) e `session.user.tenantId` (session).
- `src/types/next-auth.d.ts` (ou o augment equivalente) — declarar `tenantId`
  em `Session["user"]` e no JWT.
- `admin_create_invite_code` quando o ator é MASTER_ADMIN (tenant NULL): decidir
  se o form do `/superadmin` passa a exigir seleção de tenant (`p_tenant_id`).
  Ver NOTA no fim de `0002`.

## Invariantes de segurança preservadas

- Tabelas seguem **RLS deny-all, sem policies**; única porta = funções com o
  segredo. `tenants` nasce com o mesmo regime.
- Fronteira de tenant aplicada **dentro** das funções, a partir de
  `p_actor_id` resolvido no banco. Cliente nunca informa o tenant.
- MASTER_ADMIN continua cross-tenant; convite para MASTER_ADMIN segue **proibido**.
- MANAGER só pode convidar EMPLOYEE, e só enxerga o próprio tenant.
