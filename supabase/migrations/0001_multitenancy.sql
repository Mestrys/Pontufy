-- ============================================================================
-- Fase 1 — Schema de multi-tenancy
-- ============================================================================
-- STATUS: REVISÃO. NÃO aplicado contra pontufy-production ainda.
--
-- Introduz o conceito de "tenant" (empresa/organização). Antes desta migration
-- os roles (MASTER_ADMIN/MANAGER/EMPLOYEE) descreviam uma única org global —
-- não havia fronteira entre empresas. Agora:
--   • MASTER_ADMIN  → operador da plataforma, cross-tenant (tenant_id NULL)
--   • MANAGER       → gestor de UM tenant, enxerga só o próprio
--   • EMPLOYEE      → colaborador de UM tenant
--
-- Princípio inegociável: a fronteira é aplicada DENTRO das funções
-- SECURITY DEFINER (ver 0002). O tenant_id do ator é SEMPRE resolvido no
-- Postgres a partir de p_actor_id — o cliente nunca informa o tenant.
-- ============================================================================

begin;

-- ── 1. Tabela de tenants ────────────────────────────────────────────────────
create table if not exists public.tenants (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);

-- RLS deny-all, igual ao restante do modelo: a única porta são as funções
-- SECURITY DEFINER que exigem o APP_SERVER_SECRET.
alter table public.tenants enable row level security;
-- (sem policies = deny-all para a chave anon)

-- ── 2. Vínculo de tenant em app_users ───────────────────────────────────────
-- Nullable: MASTER_ADMIN não pertence a nenhum tenant específico.
alter table public.app_users
  add column if not exists tenant_id uuid references public.tenants(id);

create index if not exists app_users_tenant_id_idx
  on public.app_users (tenant_id);

-- ── 3. Vínculo de tenant nos convites ───────────────────────────────────────
-- O convite carimba a empresa: quem se registra herda o tenant do código.
alter table public.invite_codes
  add column if not exists tenant_id uuid references public.tenants(id);

create index if not exists invite_codes_tenant_id_idx
  on public.invite_codes (tenant_id);

-- ── 4. Backfill dos dados existentes ────────────────────────────────────────
-- Cria um tenant "default" e vincula todos os usuários/convites atuais que
-- não sejam MASTER_ADMIN. Idempotente.
do $$
declare
  v_default_tenant uuid;
begin
  select id into v_default_tenant from public.tenants where name = 'Organização Padrão' limit 1;
  if v_default_tenant is null then
    insert into public.tenants (name) values ('Organização Padrão')
      returning id into v_default_tenant;
  end if;

  update public.app_users
     set tenant_id = v_default_tenant
   where tenant_id is null
     and role <> 'MASTER_ADMIN';

  update public.invite_codes
     set tenant_id = v_default_tenant
   where tenant_id is null;
end $$;

-- ── 5. Integridade: não-MASTER_ADMIN precisa de tenant ──────────────────────
-- Garante a regra no schema, não só na aplicação.
alter table public.app_users
  drop constraint if exists app_users_tenant_required;
alter table public.app_users
  add constraint app_users_tenant_required
  check (role = 'MASTER_ADMIN' or tenant_id is not null);

commit;
