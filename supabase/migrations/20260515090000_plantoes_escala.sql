-- Plantões de escala (visões semanal e mensal).

create table public.plantoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  local_id uuid not null references public.locais (id) on delete cascade,
  setor_id uuid not null references public.setores (id) on delete cascade,
  profissional_id uuid references public.profissionais (id) on delete set null,
  data_plantao date not null,
  hora_inicio text not null,
  hora_fim text not null,
  status text not null default 'pendente'
    check (status in ('vago', 'confirmado', 'pendente')),
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.plantoes is
  'Plantões agendados por local, setor e dia (escala semanal/mensal).';

create index plantoes_user_data_idx on public.plantoes (user_id, data_plantao);
create index plantoes_user_local_setor_idx on public.plantoes (user_id, local_id, setor_id);

alter table public.plantoes enable row level security;

create policy "plantoes_select_own"
  on public.plantoes
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "plantoes_insert_own"
  on public.plantoes
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "plantoes_update_own"
  on public.plantoes
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "plantoes_delete_own"
  on public.plantoes
  for delete
  to authenticated
  using (auth.uid() = user_id);
