-- Dados de demonstração para relatórios (frequência UTI PED, SCIH e consolidado SCIH).
-- Execute no SQL Editor do Supabase (mesmo fluxo das outras migrations).

create table if not exists public.relatorio_demo_frequencia (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  setor text not null check (setor in ('UTI_PED', 'SCIH')),
  competencia date not null,
  profissional_nome text not null,
  dia smallint not null check (dia >= 1 and dia <= 31),
  turno text not null,
  created_at timestamptz not null default now()
);

comment on table public.relatorio_demo_frequencia is 'Grade de frequência/plantão para relatórios (demo por usuário).';

create index if not exists idx_relatorio_demo_freq_user
  on public.relatorio_demo_frequencia (user_id, competencia, setor);

alter table public.relatorio_demo_frequencia enable row level security;

create policy "relatorio_demo_freq_select_own"
  on public.relatorio_demo_frequencia for select to authenticated
  using (auth.uid() = user_id);

create policy "relatorio_demo_freq_insert_own"
  on public.relatorio_demo_frequencia for insert to authenticated
  with check (auth.uid() = user_id);

create policy "relatorio_demo_freq_delete_own"
  on public.relatorio_demo_frequencia for delete to authenticated
  using (auth.uid() = user_id);

create table if not exists public.relatorio_demo_scih_indicador (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  competencia date not null,
  indicador text not null,
  valor text not null,
  created_at timestamptz not null default now()
);

comment on table public.relatorio_demo_scih_indicador is 'Indicadores SCIH para relatório (demo por usuário).';

create index if not exists idx_relatorio_demo_scih_ind_user
  on public.relatorio_demo_scih_indicador (user_id, competencia);

alter table public.relatorio_demo_scih_indicador enable row level security;

create policy "relatorio_demo_scih_ind_select_own"
  on public.relatorio_demo_scih_indicador for select to authenticated
  using (auth.uid() = user_id);

create policy "relatorio_demo_scih_ind_insert_own"
  on public.relatorio_demo_scih_indicador for insert to authenticated
  with check (auth.uid() = user_id);

create policy "relatorio_demo_scih_ind_delete_own"
  on public.relatorio_demo_scih_indicador for delete to authenticated
  using (auth.uid() = user_id);

create table if not exists public.relatorio_demo_scih_ocorrencia (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  competencia date not null,
  data_ocorrencia date not null,
  tipo text not null,
  resumo text not null,
  created_at timestamptz not null default now()
);

comment on table public.relatorio_demo_scih_ocorrencia is 'Ocorrências SCIH para relatório (demo por usuário).';

create index if not exists idx_relatorio_demo_scih_occ_user
  on public.relatorio_demo_scih_ocorrencia (user_id, competencia);

alter table public.relatorio_demo_scih_ocorrencia enable row level security;

create policy "relatorio_demo_scih_occ_select_own"
  on public.relatorio_demo_scih_ocorrencia for select to authenticated
  using (auth.uid() = user_id);

create policy "relatorio_demo_scih_occ_insert_own"
  on public.relatorio_demo_scih_ocorrencia for insert to authenticated
  with check (auth.uid() = user_id);

create policy "relatorio_demo_scih_occ_delete_own"
  on public.relatorio_demo_scih_ocorrencia for delete to authenticated
  using (auth.uid() = user_id);
