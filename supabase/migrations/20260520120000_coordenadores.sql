-- Coordenadores (por conta/autenticação do titular) e vínculos com setores.

create table public.coordenadores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  email text,
  telefone text,
  telefone2 text,
  local_id uuid references public.locais (id) on delete set null,
  detalhes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.coordenadores is
  'Coordenadores vinculados ao utilizador dono da conta (gestão de plantões).';

create index coordenadores_user_nome_idx on public.coordenadores (user_id, nome);

alter table public.coordenadores enable row level security;

create policy "coordenadores_select_own"
  on public.coordenadores
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "coordenadores_insert_own"
  on public.coordenadores
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "coordenadores_update_own"
  on public.coordenadores
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "coordenadores_delete_own"
  on public.coordenadores
  for delete
  to authenticated
  using (auth.uid() = user_id);


create table public.coordenador_setores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  coordenador_id uuid not null references public.coordenadores (id) on delete cascade,
  setor_id uuid not null references public.setores (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint coordenador_setores_unique unique (coordenador_id, setor_id)
);

comment on table public.coordenador_setores is
  'Setores aos quais o coordenador tem acesso/contexto dentro da conta.';

create index coordenador_setores_user_coord_idx
  on public.coordenador_setores (user_id, coordenador_id);

create index coordenador_setores_setor_idx on public.coordenador_setores (setor_id);

alter table public.coordenador_setores enable row level security;

create policy "coordenador_setores_select_own"
  on public.coordenador_setores
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "coordenador_setores_insert_own"
  on public.coordenador_setores
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "coordenador_setores_update_own"
  on public.coordenador_setores
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "coordenador_setores_delete_own"
  on public.coordenador_setores
  for delete
  to authenticated
  using (auth.uid() = user_id);
