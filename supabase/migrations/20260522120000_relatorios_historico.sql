-- Histórico de relatórios impressos / exportados em PDF pela emissão.

create table public.relatorios_historico (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tipo_relatorio text not null
    check (
      tipo_relatorio in (
        'FrequenciaSetor',
        'FrequenciaCoordenacao',
        'RelatorioSCIRAS'
      )
    ),
  titulo text not null,
  competencia text not null,
  local_ref text not null,
  local_nome text not null,
  cabecalho jsonb not null default '{}'::jsonb,
  snapshot jsonb not null default '{}'::jsonb,
  impresso_em timestamptz not null default now(),
  created_at timestamptz not null default now()
);

comment on table public.relatorios_historico is
  'Registo de cada impressão/exportação PDF feita na emissão de relatórios.';

create index relatorios_historico_user_impresso_idx
  on public.relatorios_historico (user_id, impresso_em desc);

alter table public.relatorios_historico enable row level security;

create policy "relatorios_historico_select_own"
  on public.relatorios_historico
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "relatorios_historico_insert_own"
  on public.relatorios_historico
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "relatorios_historico_delete_own"
  on public.relatorios_historico
  for delete
  to authenticated
  using (auth.uid() = user_id);
