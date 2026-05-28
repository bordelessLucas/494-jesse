-- Marketplace de trocas/repasses de plantões (mural + aprovação de coordenação).

alter table public.plantoes
  add column if not exists disponivel_mural boolean not null default false;

-- Expandir enum textual de status para suportar anúncio de troca/repasse.
alter table public.plantoes
  drop constraint if exists plantoes_status_check;

alter table public.plantoes
  add constraint plantoes_status_check
  check (status in ('vago', 'confirmado', 'pendente', 'realizado', 'pendente_troca'));

create table if not exists public.plantoes_trocas_solicitacoes (
  id uuid primary key default gen_random_uuid(),
  tenant_user_id uuid not null references auth.users (id) on delete cascade,
  plantao_id uuid not null references public.plantoes (id) on delete cascade,
  anunciante_profissional_id uuid not null references public.profissionais (id) on delete cascade,
  candidato_profissional_id uuid not null references public.profissionais (id) on delete cascade,
  status text not null default 'aguardando_aprovacao_coordenador'
    check (status in ('aguardando_aprovacao_coordenador', 'aprovada', 'reprovada', 'cancelada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint plantoes_trocas_unique_open unique (plantao_id, candidato_profissional_id, status)
);

comment on table public.plantoes_trocas_solicitacoes is
  'Solicitações para assumir plantões anunciados no mural, com aprovação da coordenação.';

create index if not exists plantoes_trocas_tenant_status_idx
  on public.plantoes_trocas_solicitacoes (tenant_user_id, status, created_at desc);

alter table public.plantoes_trocas_solicitacoes enable row level security;

-- Coordenação/titular: vê tudo do tenant.
create policy "plantoes_trocas_select_titular"
  on public.plantoes_trocas_solicitacoes
  for select
  to authenticated
  using (tenant_user_id = public.auth_tenant_user_id() and public.auth_is_titular_conta());

-- Membro/profissional: vê solicitações onde é anunciante ou candidato.
create policy "plantoes_trocas_select_membro"
  on public.plantoes_trocas_solicitacoes
  for select
  to authenticated
  using (
    tenant_user_id = public.auth_tenant_user_id()
    and (
      anunciante_profissional_id = public.membro_profissional_id()
      or candidato_profissional_id = public.membro_profissional_id()
    )
  );

-- Inserção: membro/profissional pode candidatar-se a plantões do tenant.
create policy "plantoes_trocas_insert_membro"
  on public.plantoes_trocas_solicitacoes
  for insert
  to authenticated
  with check (
    tenant_user_id = public.auth_tenant_user_id()
    and candidato_profissional_id = public.membro_profissional_id()
  );

-- Aprovação/reprovação: apenas titular/coordenação.
create policy "plantoes_trocas_update_titular"
  on public.plantoes_trocas_solicitacoes
  for update
  to authenticated
  using (tenant_user_id = public.auth_tenant_user_id() and public.auth_is_titular_conta())
  with check (tenant_user_id = public.auth_tenant_user_id() and public.auth_is_titular_conta());

