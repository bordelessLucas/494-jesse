-- Especialidades cadastradas + perfil visualizador (auditoria externa / direção).

-- ---------------------------------------------------------------------------
-- Especialidades
-- ---------------------------------------------------------------------------

create table public.especialidades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  conselho_classe text not null
    check (conselho_classe in ('CRM', 'COREN')),
  valor_base_hora numeric not null default 0
    check (valor_base_hora >= 0),
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint especialidades_user_nome_unique unique (user_id, nome)
);

comment on table public.especialidades is
  'Catálogo de especialidades com conselho de classe e valor base hora para remuneração.';

create index especialidades_user_idx on public.especialidades (user_id, nome);

alter table public.especialidades enable row level security;

create policy "especialidades_tenant"
  on public.especialidades
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Perfil visualizador em contas_membros
-- ---------------------------------------------------------------------------

alter table public.contas_membros
  drop constraint if exists contas_membros_role_check;

alter table public.contas_membros
  add constraint contas_membros_role_check
  check (role in ('profissional', 'auditor', 'faturista', 'visualizador'));

alter table public.contas_membros
  drop constraint if exists contas_membros_profissional_role_chk;

alter table public.contas_membros
  add constraint contas_membros_profissional_role_chk
  check (
    (role = 'profissional' and profissional_id is not null)
    or role in ('auditor', 'faturista', 'visualizador')
  );

comment on column public.contas_membros.role is
  'Papel do membro: profissional, auditor, faturista ou visualizador (somente leitura).';

create or replace function public.auth_is_visualizador()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.auth_membro_role() = 'visualizador';
$$;

comment on function public.auth_is_visualizador() is
  'Verdadeiro quando o membro autenticado tem perfil visualizador (somente leitura).';
