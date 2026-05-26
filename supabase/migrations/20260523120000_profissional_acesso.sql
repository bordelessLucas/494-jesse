-- Acesso de profissionais como membros da conta (login próprio + permissões + escopo por setor).

alter table public.profissionais
  add column if not exists auth_user_id uuid references auth.users (id) on delete set null;

create unique index if not exists profissionais_auth_user_id_uidx
  on public.profissionais (auth_user_id)
  where auth_user_id is not null;

comment on column public.profissionais.auth_user_id is
  'Utilizador Supabase Auth associado a este profissional (acesso limitado).';

create table public.contas_membros (
  id uuid primary key default gen_random_uuid(),
  tenant_user_id uuid not null references auth.users (id) on delete cascade,
  auth_user_id uuid not null references auth.users (id) on delete cascade,
  profissional_id uuid not null references public.profissionais (id) on delete cascade,
  role text not null default 'profissional'
    check (role in ('profissional')),
  permissoes jsonb not null default '{}'::jsonb,
  must_change_password boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contas_membros_auth_user_unique unique (auth_user_id),
  constraint contas_membros_profissional_unique unique (profissional_id)
);

comment on table public.contas_membros is
  'Membros convidados (ex.: profissionais) com login próprio e permissões parciais na conta do titular.';

create index contas_membros_tenant_idx on public.contas_membros (tenant_user_id);
create index contas_membros_auth_idx on public.contas_membros (auth_user_id);

alter table public.contas_membros enable row level security;

-- Titular gere membros da sua conta; membro lê apenas o próprio registo.
create policy "contas_membros_select"
  on public.contas_membros
  for select
  to authenticated
  using (
    auth.uid() = tenant_user_id
    or auth.uid() = auth_user_id
  );

create policy "contas_membros_update_titular"
  on public.contas_membros
  for update
  to authenticated
  using (auth.uid() = tenant_user_id)
  with check (auth.uid() = tenant_user_id);

create policy "contas_membros_update_self_password_flag"
  on public.contas_membros
  for update
  to authenticated
  using (auth.uid() = auth_user_id)
  with check (auth.uid() = auth_user_id);

create policy "contas_membros_delete_titular"
  on public.contas_membros
  for delete
  to authenticated
  using (auth.uid() = tenant_user_id);

-- Inserção feita pela Edge Function (service role) ou titular autenticado.
create policy "contas_membros_insert_titular"
  on public.contas_membros
  for insert
  to authenticated
  with check (auth.uid() = tenant_user_id);

-- Helpers RLS
create or replace function public.auth_is_titular_conta()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1 from public.contas_membros cm where cm.auth_user_id = auth.uid()
  );
$$;

create or replace function public.auth_tenant_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select cm.tenant_user_id
      from public.contas_membros cm
      where cm.auth_user_id = auth.uid()
      limit 1
    ),
    auth.uid()
  );
$$;

create or replace function public.membro_profissional_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select cm.profissional_id
  from public.contas_membros cm
  where cm.auth_user_id = auth.uid()
  limit 1;
$$;

create or replace function public.membro_tem_setor(p_setor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.contas_membros cm
    join public.profissional_setores ps on ps.profissional_id = cm.profissional_id
    where cm.auth_user_id = auth.uid()
      and ps.setor_id = p_setor_id
  );
$$;

-- Profissionais: membro vê apenas o próprio registo.
create policy "profissionais_select_membro_proprio"
  on public.profissionais
  for select
  to authenticated
  using (
    auth_user_id = auth.uid()
    or id = public.membro_profissional_id()
  );

-- Setores vinculados: membro vê os seus.
create policy "profissional_setores_select_membro"
  on public.profissional_setores
  for select
  to authenticated
  using (
    profissional_id = public.membro_profissional_id()
  );

-- Locais/setores: membro vê unidades onde tem setor vinculado; titular mantém regra original.
create policy "locais_select_membro_setor"
  on public.locais
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.contas_membros cm
      join public.profissional_setores ps on ps.profissional_id = cm.profissional_id
      join public.setores s on s.id = ps.setor_id
      where cm.auth_user_id = auth.uid()
        and s.local_id = locais.id
        and locais.user_id = cm.tenant_user_id
    )
  );

create policy "setores_select_membro_vinculado"
  on public.setores
  for select
  to authenticated
  using (
    public.membro_tem_setor(setores.id)
    and setores.user_id = public.auth_tenant_user_id()
  );

-- Plantões: membro vê plantões dos seus setores (e onde é o profissional).
create policy "plantoes_select_membro"
  on public.plantoes
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.contas_membros cm
      where cm.auth_user_id = auth.uid()
        and plantoes.user_id = cm.tenant_user_id
        and (
          public.membro_tem_setor(plantoes.setor_id)
          or plantoes.profissional_id = cm.profissional_id
        )
    )
  );
