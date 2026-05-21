-- Modelos de escala semanal (padrão por local/setor, N semanas de ciclo).

create table public.escala_modelos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  local_id uuid not null references public.locais (id) on delete cascade,
  setor_id uuid not null references public.setores (id) on delete cascade,
  nome text not null default 'Modelo',
  quantidade_semanas int not null default 1
    check (quantidade_semanas >= 1 and quantidade_semanas <= 52),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.escala_modelos is
  'Cabeçalho de modelo de escala (hospital, setor, duração do ciclo em semanas).';

create index escala_modelos_user_local_setor_idx
  on public.escala_modelos (user_id, local_id, setor_id);

alter table public.escala_modelos enable row level security;

create policy "escala_modelos_select_own"
  on public.escala_modelos
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "escala_modelos_insert_own"
  on public.escala_modelos
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "escala_modelos_update_own"
  on public.escala_modelos
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "escala_modelos_delete_own"
  on public.escala_modelos
  for delete
  to authenticated
  using (auth.uid() = user_id);

create table public.escala_modelo_itens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  modelo_id uuid not null references public.escala_modelos (id) on delete cascade,
  semana_index int not null default 1
    check (semana_index >= 1 and semana_index <= 52),
  dia_semana int not null
    check (dia_semana >= 1 and dia_semana <= 7),
  hora_inicio text not null,
  hora_fim text not null,
  duracao_minutos int
    check (duracao_minutos is null or (duracao_minutos >= 0 and duracao_minutos <= 24 * 60)),
  tipo text not null default 'util'
    check (tipo in ('util', 'fds')),
  profissional_id uuid references public.profissionais (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.escala_modelo_itens is
  'Slots de plantão do modelo: semana no ciclo (1..N), dia da semana (1=seg … 7=dom), horários e vínculo opcional a profissional.';

comment on column public.escala_modelo_itens.dia_semana is
  '1 = segunda … 7 = domingo.';

create index escala_modelo_itens_modelo_idx
  on public.escala_modelo_itens (modelo_id, semana_index, dia_semana);

alter table public.escala_modelo_itens enable row level security;

create policy "escala_modelo_itens_select_own"
  on public.escala_modelo_itens
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "escala_modelo_itens_insert_own"
  on public.escala_modelo_itens
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "escala_modelo_itens_update_own"
  on public.escala_modelo_itens
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "escala_modelo_itens_delete_own"
  on public.escala_modelo_itens
  for delete
  to authenticated
  using (auth.uid() = user_id);
