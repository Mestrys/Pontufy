-- ============================================================================
-- Fase 2 — Funções SECURITY DEFINER com escopo de tenant
-- ============================================================================
-- STATUS: TEMPLATE PARA REVISÃO/MERGE. NÃO aplicado.
--
-- ⚠️  Os corpos completos das funções vivem apenas no Postgres de produção
--     (exigem o APP_SERVER_SECRET e não estão versionados no repo). Este
--     arquivo mostra EXATAMENTE o padrão de tenant-scoping a inserir em cada
--     função. Antes de aplicar, faça o merge com o corpo real de cada uma —
--     obtenha o `CREATE OR REPLACE FUNCTION ...` atual de produção (introspec-
--     ção read-only) e enxerte os blocos marcados com «TENANT».
--
-- Regra de ouro (repetida da 0001): o tenant_id do ator é SEMPRE resolvido
-- aqui dentro a partir de p_actor_id. O cliente jamais informa o tenant.
-- MASTER_ADMIN (tenant_id NULL) enxerga cross-tenant; os demais, só o seu.
-- ============================================================================

begin;

-- ── Helper: resolve o tenant do ator, validando o segredo ───────────────────
-- Centraliza a autorização de tenant para as funções de admin não repetirem
-- a lógica. Retorna o tenant_id do ator (NULL para MASTER_ADMIN).
create or replace function public._actor_tenant(
  p_secret   text,
  p_actor_id uuid,
  out actor_role text,
  out actor_tenant uuid
)
language plpgsql
security definer
set search_path = public
as $$
begin
  -- «TENANT» validação do segredo — idêntica ao restante do modelo
  if p_secret is null
     or p_secret <> (select value from public.app_config where key = 'app_server_secret') then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  select role, tenant_id into actor_role, actor_tenant
    from public.app_users
   where id = p_actor_id;

  if actor_role is null then
    raise exception 'actor not found' using errcode = 'P0002';
  end if;
end $$;

-- ── admin_list_users ────────────────────────────────────────────────────────
-- ANTES: lista TODOS os usuários (org global).
-- DEPOIS: MASTER_ADMIN vê todos; MANAGER vê só o próprio tenant.
create or replace function public.admin_list_users(
  p_secret   text,
  p_actor_id uuid
)
returns table (name text, email text, role text, created_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role   text;
  v_tenant uuid;
begin
  select actor_role, actor_tenant into v_role, v_tenant
    from public._actor_tenant(p_secret, p_actor_id);

  -- «TENANT» só MASTER_ADMIN e MANAGER listam usuários
  if v_role not in ('MASTER_ADMIN', 'MANAGER') then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
    select u.name, u.email, u.role, u.created_at
      from public.app_users u
     -- «TENANT» MASTER_ADMIN (v_tenant NULL) ignora o filtro; MANAGER é preso ao seu tenant
     where v_role = 'MASTER_ADMIN'
        or u.tenant_id = v_tenant
     order by u.created_at desc;
end $$;

-- ── admin_list_invite_codes ─────────────────────────────────────────────────
create or replace function public.admin_list_invite_codes(
  p_secret   text,
  p_actor_id uuid
)
returns table (
  code text, role_type text, is_used boolean,
  used_by_email text, expires_at timestamptz, created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role   text;
  v_tenant uuid;
begin
  select actor_role, actor_tenant into v_role, v_tenant
    from public._actor_tenant(p_secret, p_actor_id);

  if v_role not in ('MASTER_ADMIN', 'MANAGER') then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
    select c.code, c.role_type, c.is_used, c.used_by_email, c.expires_at, c.created_at
      from public.invite_codes c
     where v_role = 'MASTER_ADMIN'
        or c.tenant_id = v_tenant   -- «TENANT»
     order by c.created_at desc;
end $$;

-- ── admin_create_invite_code ────────────────────────────────────────────────
-- ANTES: cria convite solto.
-- DEPOIS: carimba o tenant do ator no convite. MANAGER só pode convidar
-- EMPLOYEE (não pode criar outro MANAGER); MASTER_ADMIN mantém o poder atual.
create or replace function public.admin_create_invite_code(
  p_secret        text,
  p_actor_id      uuid,
  p_role_type     text,
  p_validity_days int
)
returns table (code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role   text;
  v_tenant uuid;
  v_code   text;
begin
  select actor_role, actor_tenant into v_role, v_tenant
    from public._actor_tenant(p_secret, p_actor_id);

  -- «TENANT» regras de quem pode convidar quem
  if v_role = 'MASTER_ADMIN' then
    null; -- pode convidar MANAGER ou EMPLOYEE em qualquer tenant já existente
  elsif v_role = 'MANAGER' then
    if p_role_type <> 'EMPLOYEE' then
      raise exception 'manager can only invite employees' using errcode = '42501';
    end if;
  else
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_role_type = 'MASTER_ADMIN' then
    raise exception 'invite for master admin is never allowed' using errcode = '42501';
  end if;

  v_code := upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 10));

  insert into public.invite_codes (code, role_type, tenant_id, expires_at)
  values (
    v_code,
    p_role_type,
    v_tenant,   -- «TENANT» convite herda o tenant do ator (NULL exige tratamento p/ MASTER_ADMIN, ver nota)
    now() + make_interval(days => p_validity_days)
  );

  return query select v_code;
end $$;
-- NOTA: quando o ator é MASTER_ADMIN (v_tenant NULL), o tenant do convite
-- precisa vir explícito — adicionar p_tenant_id à assinatura e ao form do
-- /superadmin é o passo natural. Deixado fora deste template para não
-- inflar o escopo; sinalizado para decisão.

-- ── auth_register ───────────────────────────────────────────────────────────
-- ANTES: cria usuário com o role do convite.
-- DEPOIS: herda TAMBÉM o tenant_id do convite. Sem tocar na assinatura
-- chamada pela app (p_name, p_email, p_password, p_code) — a mudança é interna.
create or replace function public.auth_register(
  p_secret   text,
  p_name     text,
  p_email    text,
  p_password text,
  p_code     text
)
returns table (id uuid, name text, email text, role text, "mustChangePassword" boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite   record;
  v_new_id   uuid;
begin
  -- «TENANT» validação do segredo (mantida do corpo original) ...

  select * into v_invite
    from public.invite_codes
   where code = p_code and not is_used and expires_at > now()
   for update;

  if v_invite is null then
    raise exception 'invalid or expired invite code' using errcode = '42501';
  end if;

  insert into public.app_users (name, email, password_hash, role, tenant_id, must_change_password)
  values (
    p_name,
    lower(p_email),
    crypt(p_password, gen_salt('bf')),
    v_invite.role_type,
    v_invite.tenant_id,   -- «TENANT» usuário nasce dentro do tenant do convite
    false
  )
  returning app_users.id into v_new_id;

  update public.invite_codes
     set is_used = true, used_by_email = lower(p_email)
   where code = p_code;

  return query
    select u.id, u.name, u.email, u.role, u.must_change_password
      from public.app_users u where u.id = v_new_id;
end $$;

commit;
