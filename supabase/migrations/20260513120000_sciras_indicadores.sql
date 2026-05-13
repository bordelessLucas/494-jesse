-- Indicadores clínicos SCIRAS: UTI (busca activa) e centro cirúrgico (infecção em cirurgias limpas).
--
-- Aplicar: Supabase → SQL → New query (ou `supabase db push` com CLI ligada ao projecto).

-- UTI -------------------------------------------------------------------------

create table public.sciras_indicadores_uti (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Sempre o 1.º dia do mês de competência (ex.: 2026-05-01 para Maio/2026).
  mes_competencia date not null,
  setor text not null,
  total_pacientes_dia numeric(14, 4) not null,
  usuarios_acompanhados_busca_ativa integer not null,
  taxa_busca_ativa numeric(14, 4) generated always as (
    case
      when total_pacientes_dia > 0::numeric
      then round(
        (usuarios_acompanhados_busca_ativa::numeric / total_pacientes_dia) * 100::numeric,
        4
      )
      else 0::numeric
    end
  ) stored,
  created_at timestamptz not null default now(),
  constraint sciras_indicadores_uti_mes_primeiro_dia check (
    extract(day from mes_competencia) = 1
  ),
  constraint sciras_indicadores_uti_pacientes_nonneg check (total_pacientes_dia >= 0),
  constraint sciras_indicadores_uti_acompanhados_nonneg check (
    usuarios_acompanhados_busca_ativa >= 0
  ),
  constraint sciras_indicadores_uti_acompanhados_le_pacientes check (
    total_pacientes_dia <= 0::numeric
    or usuarios_acompanhados_busca_ativa::numeric <= total_pacientes_dia
  ),
  constraint sciras_indicadores_uti_sem_pacientes_sem_acompanhados check (
    total_pacientes_dia > 0::numeric
    or usuarios_acompanhados_busca_ativa = 0
  ),
  unique (user_id, mes_competencia, setor)
);

comment on table public.sciras_indicadores_uti is
  'Indicadores SCIRAS por UTI: pacientes/dia, busca activa e taxa derivada.';

create index sciras_indicadores_uti_user_mes_idx
  on public.sciras_indicadores_uti (user_id, mes_competencia desc);

alter table public.sciras_indicadores_uti enable row level security;

create policy "sciras_uti_select_own"
  on public.sciras_indicadores_uti
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "sciras_uti_insert_own"
  on public.sciras_indicadores_uti
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "sciras_uti_update_own"
  on public.sciras_indicadores_uti
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "sciras_uti_delete_own"
  on public.sciras_indicadores_uti
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Centro cirúrgico -------------------------------------------------------------

create table public.sciras_indicadores_cirurgicos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  mes_competencia date not null,
  total_cirurgias integer not null,
  total_cirurgias_limpas integer not null,
  num_infeccoes_cirurgias_limpas integer not null,
  taxa_infeccao numeric(14, 4) generated always as (
    case
      when total_cirurgias_limpas > 0
      then round(
        (
          num_infeccoes_cirurgias_limpas::numeric
          / total_cirurgias_limpas::numeric
        ) * 100::numeric,
        4
      )
      else 0::numeric
    end
  ) stored,
  created_at timestamptz not null default now(),
  constraint sciras_indicadores_cir_mes_primeiro_dia check (
    extract(day from mes_competencia) = 1
  ),
  constraint sciras_indicadores_cir_total_nonneg check (total_cirurgias >= 0),
  constraint sciras_indicadores_cir_limpas_nonneg check (total_cirurgias_limpas >= 0),
  constraint sciras_indicadores_cir_infeccoes_nonneg check (
    num_infeccoes_cirurgias_limpas >= 0
  ),
  constraint sciras_indicadores_cir_limpas_le_total check (
    total_cirurgias_limpas <= total_cirurgias
  ),
  constraint sciras_indicadores_cir_infeccoes_le_limpas check (
    num_infeccoes_cirurgias_limpas <= total_cirurgias_limpas
  ),
  constraint sciras_indicadores_cir_sem_limpas_sem_infeccao check (
    total_cirurgias_limpas > 0
    or num_infeccoes_cirurgias_limpas = 0
  ),
  unique (user_id, mes_competencia)
);

comment on table public.sciras_indicadores_cirurgicos is
  'Indicadores SCIRAS do centro cirúrgico: cirurgias, infecções em limpas e taxa derivada.';

create index sciras_indicadores_cir_user_mes_idx
  on public.sciras_indicadores_cirurgicos (user_id, mes_competencia desc);

alter table public.sciras_indicadores_cirurgicos enable row level security;

create policy "sciras_cir_select_own"
  on public.sciras_indicadores_cirurgicos
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "sciras_cir_insert_own"
  on public.sciras_indicadores_cirurgicos
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "sciras_cir_update_own"
  on public.sciras_indicadores_cirurgicos
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "sciras_cir_delete_own"
  on public.sciras_indicadores_cirurgicos
  for delete
  to authenticated
  using (auth.uid() = user_id);
