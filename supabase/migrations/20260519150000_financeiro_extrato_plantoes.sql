-- Financeiro: valores por plantão, glosas, status «realizado» e fechamento mensal por profissional.

alter table public.plantoes drop constraint if exists plantoes_status_check;

alter table public.plantoes
  add constraint plantoes_status_check
  check (status in ('vago', 'confirmado', 'pendente', 'realizado'));

alter table public.plantoes
  add column if not exists valor_plantao numeric(14, 2) not null default 0,
  add column if not exists ajuste_glosa numeric(14, 2) not null default 0;

comment on column public.plantoes.valor_plantao is
  'Valor bruto do plantão definido no cadastro da escala.';

comment on column public.plantoes.ajuste_glosa is
  'Ajuste financeiro no extrato (negativo = desconto/glossa, positivo = acréscimo).';

create table public.financeiro_extrato_periodo (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  profissional_id uuid not null references public.profissionais (id) on delete cascade,
  competencia text not null,
  fechado_em timestamptz,
  status_financeiro text not null default 'pendente'
    check (status_financeiro in ('pendente', 'processado', 'pago')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint financeiro_extrato_periodo_competencia_fmt check (competencia ~ '^\d{4}-\d{2}$'),
  constraint financeiro_extrato_periodo_unique unique (user_id, profissional_id, competencia)
);

comment on table public.financeiro_extrato_periodo is
  'Controlo do extrato por profissional e mês (competência YYYY-MM).';

create index financeiro_extrato_periodo_user_idx
  on public.financeiro_extrato_periodo (user_id);

alter table public.financeiro_extrato_periodo enable row level security;

create policy "financeiro_extrato_select_own"
  on public.financeiro_extrato_periodo
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "financeiro_extrato_insert_own"
  on public.financeiro_extrato_periodo
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "financeiro_extrato_update_own"
  on public.financeiro_extrato_periodo
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "financeiro_extrato_delete_own"
  on public.financeiro_extrato_periodo
  for delete
  to authenticated
  using (auth.uid() = user_id);
