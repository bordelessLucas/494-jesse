-- Histórico append-only de eventos em plantões (trocas, passagens, substituições, faltas).

create table if not exists public.plantoes_historico_eventos (
  id uuid primary key default gen_random_uuid(),
  tenant_user_id uuid not null references auth.users (id) on delete cascade,
  plantao_id uuid not null references public.plantoes (id) on delete cascade,
  plantao_destino_id uuid references public.plantoes (id) on delete set null,
  solicitacao_id uuid references public.plantoes_trocas_solicitacoes (id) on delete set null,
  evento_par_id uuid references public.plantoes_historico_eventos (id) on delete set null,
  tipo_evento text not null
    check (tipo_evento in (
      'passagem',
      'troca',
      'substituicao_coordenacao',
      'cobertura',
      'falta_justificada',
      'falta_nao_justificada'
    )),
  situacao_rotulo text not null default 'Trocado',
  profissional_fixo_id uuid references public.profissionais (id) on delete set null,
  profissional_responsavel_id uuid references public.profissionais (id) on delete set null,
  justificativa text,
  observacao_interna text,
  origem text not null default 'sistema'
    check (origem in ('mural', 'coordenacao', 'sistema')),
  realizado_em timestamptz not null default now(),
  registrado_por_auth_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.plantoes_historico_eventos is
  'Registro imutável de trocas, passagens, substituições pela coordenação e faltas em plantões.';

create index if not exists plantoes_historico_tenant_realizado_idx
  on public.plantoes_historico_eventos (tenant_user_id, realizado_em desc);

create index if not exists plantoes_historico_plantao_idx
  on public.plantoes_historico_eventos (plantao_id);

create index if not exists plantoes_historico_tipo_idx
  on public.plantoes_historico_eventos (tenant_user_id, tipo_evento, realizado_em desc);

create index if not exists plantoes_historico_par_idx
  on public.plantoes_historico_eventos (evento_par_id)
  where evento_par_id is not null;

alter table public.plantoes_historico_eventos enable row level security;

create policy "plantoes_historico_select_titular"
  on public.plantoes_historico_eventos
  for select
  to authenticated
  using (
    tenant_user_id = public.auth_tenant_user_id()
    and public.auth_is_titular_conta()
  );

create policy "plantoes_historico_select_membro"
  on public.plantoes_historico_eventos
  for select
  to authenticated
  using (
    tenant_user_id = public.auth_tenant_user_id()
    and (
      profissional_fixo_id = public.membro_profissional_id()
      or profissional_responsavel_id = public.membro_profissional_id()
    )
  );

create policy "plantoes_historico_insert_titular"
  on public.plantoes_historico_eventos
  for insert
  to authenticated
  with check (
    tenant_user_id = public.auth_tenant_user_id()
    and public.auth_is_titular_conta()
  );

create policy "plantoes_historico_update_titular"
  on public.plantoes_historico_eventos
  for update
  to authenticated
  using (
    tenant_user_id = public.auth_tenant_user_id()
    and public.auth_is_titular_conta()
  )
  with check (
    tenant_user_id = public.auth_tenant_user_id()
    and public.auth_is_titular_conta()
  );

-- Backfill a partir de solicitações já aprovadas no mural.
insert into public.plantoes_historico_eventos (
  tenant_user_id,
  plantao_id,
  solicitacao_id,
  tipo_evento,
  situacao_rotulo,
  profissional_fixo_id,
  profissional_responsavel_id,
  justificativa,
  observacao_interna,
  origem,
  realizado_em
)
select
  s.tenant_user_id,
  s.plantao_id,
  s.id,
  'passagem',
  'Trocado',
  s.anunciante_profissional_id,
  s.candidato_profissional_id,
  nullif(trim(p.observacoes), ''),
  nullif(trim(p.observacoes), ''),
  'mural',
  s.updated_at
from public.plantoes_trocas_solicitacoes s
join public.plantoes p on p.id = s.plantao_id
where s.status = 'aprovada'
  and not exists (
    select 1
    from public.plantoes_historico_eventos h
    where h.solicitacao_id = s.id
  );

-- Emparelhar trocas mútuas no backfill (dois profissionais trocaram plantões entre si).
with pares as (
  select
    a.id as id_a,
    b.id as id_b,
    a.plantao_id as plantao_a,
    b.plantao_id as plantao_b
  from public.plantoes_historico_eventos a
  join public.plantoes_historico_eventos b
    on b.tenant_user_id = a.tenant_user_id
    and b.tipo_evento = 'passagem'
    and b.evento_par_id is null
    and b.profissional_fixo_id = a.profissional_responsavel_id
    and b.profissional_responsavel_id = a.profissional_fixo_id
    and b.id <> a.id
  where a.tipo_evento = 'passagem'
    and a.evento_par_id is null
    and a.id < b.id
)
update public.plantoes_historico_eventos e
set
  tipo_evento = 'troca',
  plantao_destino_id = case when e.id = p.id_a then p.plantao_b else p.plantao_a end,
  evento_par_id = case when e.id = p.id_a then p.id_b else p.id_a end
from pares p
where e.id in (p.id_a, p.id_b);
