-- ============================================================================
-- Schema base — auth por convite, RPC SECURITY DEFINER, RLS deny-all
-- ============================================================================
-- Recriação para o projeto Supabase "Pontufy_App" (iuvymuotbddjtrxjlueh),
-- provisionado vazio. Implementa o MESMO CONTRATO que pontufy-app já espera
-- (nomes de função, parâmetros e formato de retorno confirmados em
-- src/lib/supabase-rpc.ts e nos call-sites de src/auth.ts,
-- src/app/api/auth/*, src/app/superadmin/*) — não é cópia de produção
-- (sem acesso de leitura a ela nesta sessão), é reimplementação limpa do
-- mesmo modelo de segurança já documentado: tabelas RLS deny-all sem
-- policies, única porta de entrada são funções SECURITY DEFINER que exigem
-- p_secret = app_config.value.
-- ============================================================================

begin;

create extension if not exists pgcrypto;

create type user_role as enum ('MASTER_ADMIN', 'MANAGER', 'EMPLOYEE');
create type invite_role as enum ('MANAGER', 'EMPLOYEE');

-- ── Tabelas ──────────────────────────────────────────────────────────────
create table app_config (
  key   text primary key,
  value text not null
);
alter table app_config enable row level security;
-- sem policies = deny-all para anon/authenticated

create table app_users (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null,
  email                text not null unique,
  password_hash        text not null,
  role                 user_role not null default 'EMPLOYEE',
  must_change_password boolean not null default false,
  created_at           timestamptz not null default now()
);
alter table app_users enable row level security;

create table invite_codes (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique,
  role_type  invite_role not null,
  is_used    boolean not null default false,
  used_by    uuid unique references app_users(id),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
alter table invite_codes enable row level security;

-- ── Segredo do servidor ──────────────────────────────────────────────────
-- Valor real inserido separadamente via UPDATE, fora deste arquivo versionado.
insert into app_config (key, value) values ('app_server_secret', 'REPLACE_ME');

-- ── Helper: valida o segredo, levanta exceção se inválido ───────────────
create or replace function _check_secret(p_secret text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if p_secret is null
     or p_secret <> (select value from app_config where key = 'app_server_secret') then
    raise exception 'unauthorized' using errcode = '42501';
  end if;
end $$;

-- ── auth_login(p_secret, p_email, p_password) ───────────────────────────
-- RETURNS json (não TABLE/SETOF): o PostgREST serializa funções
-- set-returning como array ([{...}] ou []); o app espera um objeto único
-- (DbUser | null). json evita o wrapping em array.
create or replace function auth_login(p_secret text, p_email text, p_password text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user app_users;
begin
  perform _check_secret(p_secret);
  select * into v_user
    from app_users u
   where u.email = lower(p_email)
     and u.password_hash = crypt(p_password, u.password_hash);

  if v_user is null then
    return null;
  end if;
  return json_build_object(
    'id', v_user.id, 'name', v_user.name, 'email', v_user.email,
    'role', v_user.role, 'mustChangePassword', v_user.must_change_password
  );
end $$;

-- ── auth_get_user(p_secret, p_user_id) ───────────────────────────────────
create or replace function auth_get_user(p_secret text, p_user_id uuid)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user app_users;
begin
  perform _check_secret(p_secret);
  select * into v_user from app_users u where u.id = p_user_id;

  if v_user is null then
    return null;
  end if;
  return json_build_object(
    'id', v_user.id, 'name', v_user.name, 'email', v_user.email,
    'role', v_user.role, 'mustChangePassword', v_user.must_change_password
  );
end $$;

-- ── auth_register(p_secret, p_name, p_email, p_password, p_code) ────────
-- Atômica: valida o convite, cria o usuário com o role do convite,
-- marca o código como usado — sem corrida possível (lock via for update).
create or replace function auth_register(
  p_secret   text,
  p_name     text,
  p_email    text,
  p_password text,
  p_code     text
)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_invite record;
  v_user   app_users;
begin
  perform _check_secret(p_secret);

  select * into v_invite
    from invite_codes
   where code = p_code and not is_used and expires_at > now()
   for update;

  if v_invite is null then
    raise exception 'invalid or expired invite code' using errcode = '42501';
  end if;

  insert into app_users (name, email, password_hash, role, must_change_password)
  values (p_name, lower(p_email), crypt(p_password, gen_salt('bf')), v_invite.role_type, false)
  returning * into v_user;

  update invite_codes set is_used = true, used_by = v_user.id where code = p_code;

  return json_build_object(
    'id', v_user.id, 'name', v_user.name, 'email', v_user.email,
    'role', v_user.role, 'mustChangePassword', v_user.must_change_password
  );
end $$;

-- ── auth_change_password(p_secret, p_user_id, p_current_password, p_new_password) ──
create or replace function auth_change_password(
  p_secret           text,
  p_user_id          uuid,
  p_current_password text,
  p_new_password     text
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_hash text;
begin
  perform _check_secret(p_secret);

  select password_hash into v_hash from app_users where id = p_user_id;
  if v_hash is null or v_hash <> crypt(p_current_password, v_hash) then
    raise exception 'current password does not match' using errcode = '42501';
  end if;

  update app_users
     set password_hash = crypt(p_new_password, gen_salt('bf')),
         must_change_password = false
   where id = p_user_id;
end $$;

-- ── admin_list_users(p_secret, p_actor_id) — MASTER_ADMIN only ──────────
create or replace function admin_list_users(p_secret text, p_actor_id uuid)
returns table (name text, email text, role user_role, created_at timestamptz)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform _check_secret(p_secret);
  if not exists (select 1 from app_users where id = p_actor_id and role = 'MASTER_ADMIN') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query select u.name, u.email, u.role, u.created_at from app_users u order by u.created_at desc;
end $$;

-- ── admin_list_invite_codes(p_secret, p_actor_id) — MASTER_ADMIN only ───
create or replace function admin_list_invite_codes(p_secret text, p_actor_id uuid)
returns table (
  code text, role_type invite_role, is_used boolean,
  used_by_email text, expires_at timestamptz, created_at timestamptz
)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform _check_secret(p_secret);
  if not exists (select 1 from app_users where id = p_actor_id and role = 'MASTER_ADMIN') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
    select c.code, c.role_type, c.is_used, u.email, c.expires_at, c.created_at
      from invite_codes c
      left join app_users u on u.id = c.used_by
     order by c.created_at desc;
end $$;

-- ── admin_create_invite_code(p_secret, p_actor_id, p_role_type, p_validity_days) ──
-- MASTER_ADMIN only; convite para MASTER_ADMIN é sempre proibido.
create or replace function admin_create_invite_code(
  p_secret        text,
  p_actor_id      uuid,
  p_role_type     invite_role,
  p_validity_days int
)
returns table (code text)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_code text;
begin
  perform _check_secret(p_secret);
  if not exists (select 1 from app_users where id = p_actor_id and role = 'MASTER_ADMIN') then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  v_code := upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 10));

  insert into invite_codes (code, role_type, expires_at)
  values (v_code, p_role_type, now() + make_interval(days => p_validity_days));

  return query select v_code;
end $$;

commit;
