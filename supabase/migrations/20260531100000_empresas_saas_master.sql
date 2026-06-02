-- SaaS multi-tenant: cada cadastro cria uma empresa; o dono é o MASTER.
-- Dados operacionais continuam em `user_id` = `empresas.owner_user_id` (titular).
-- Funcionários entram via `contas_membros` e veem apenas dados do tenant.

create table if not exists public.empresas (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint empresas_owner_unique unique (owner_user_id)
);

comment on table public.empresas is
  'Empresa (tenant) do SaaS. O utilizador que se cadastra torna-se MASTER via owner_user_id.';

create index if not exists empresas_owner_idx on public.empresas (owner_user_id);

alter table public.empresas enable row level security;

-- MASTER vê e edita a própria empresa; funcionários leem a empresa do tenant.
create policy "empresas_select_tenant"
  on public.empresas
  for select
  to authenticated
  using (
    owner_user_id = auth.uid()
    or owner_user_id = public.auth_tenant_user_id()
  );

create policy "empresas_update_master"
  on public.empresas
  for update
  to authenticated
  using (
    owner_user_id = auth.uid()
    and public.auth_is_titular_conta()
  )
  with check (
    owner_user_id = auth.uid()
    and public.auth_is_titular_conta()
  );

-- Alias semântico: MASTER = titular (não está em contas_membros).
create or replace function public.auth_is_master()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.auth_is_titular_conta();
$$;

comment on function public.auth_is_master() is
  'Verdadeiro para o dono da empresa (cadastro inicial). Falso para funcionários em contas_membros.';

create or replace function public.auth_empresa_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select e.id
  from public.empresas e
  where e.owner_user_id = public.auth_tenant_user_id()
  limit 1;
$$;

-- Novo utilizador Auth → empresa + branding padrão (MASTER).
create or replace function public.handle_new_auth_user_empresa_master()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nome text;
begin
  v_nome := trim(
    coalesce(
      new.raw_user_meta_data ->> 'company_name',
      new.raw_user_meta_data ->> 'full_name',
      'Minha empresa'
    )
  );
  if v_nome = '' then
    v_nome := 'Minha empresa';
  end if;

  insert into public.empresas (owner_user_id, nome)
  values (new.id, v_nome)
  on conflict (owner_user_id) do update
  set
    nome = excluded.nome,
    updated_at = now();

  insert into public.user_branding (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_empresa_master on auth.users;

create trigger on_auth_user_created_empresa_master
  after insert on auth.users
  for each row
  execute function public.handle_new_auth_user_empresa_master();

-- Contas já existentes antes desta migration.
insert into public.empresas (owner_user_id, nome)
select
  u.id,
  trim(
    coalesce(
      u.raw_user_meta_data ->> 'company_name',
      u.raw_user_meta_data ->> 'full_name',
      'Minha empresa'
    )
  )
from auth.users u
where not exists (
  select 1 from public.empresas e where e.owner_user_id = u.id
);

insert into public.user_branding (user_id)
select u.id
from auth.users u
where not exists (
  select 1 from public.user_branding b where b.user_id = u.id
);
