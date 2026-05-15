-- Profissionais e vínculo com setores (carga por usuário autenticado).

create table public.profissionais (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  profissao text not null,
  sigla_conselho text not null default 'CRM',
  conselho_numero text not null default '',
  registro_uf text not null default 'PA',
  email text,
  telefone text,
  cpf text,
  local_id uuid references public.locais (id) on delete set null,
  detalhes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profissionais_registro_uf_check check (char_length(registro_uf) = 2)
);

comment on table public.profissionais is
  'Cadastro de profissionais de saúde vinculados ao usuário (conta).';

create index profissionais_user_nome_idx on public.profissionais (user_id, nome);
create index profissionais_user_local_idx on public.profissionais (user_id, local_id);

alter table public.profissionais enable row level security;

create policy "profissionais_select_own"
  on public.profissionais
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "profissionais_insert_own"
  on public.profissionais
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "profissionais_update_own"
  on public.profissionais
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "profissionais_delete_own"
  on public.profissionais
  for delete
  to authenticated
  using (auth.uid() = user_id);

create table public.profissional_setores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  profissional_id uuid not null references public.profissionais (id) on delete cascade,
  setor_id uuid not null references public.setores (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint profissional_setores_unique unique (profissional_id, setor_id)
);

comment on table public.profissional_setores is
  'Associação N:N entre profissionais e setores de atuação.';

create index profissional_setores_user_prof_idx
  on public.profissional_setores (user_id, profissional_id);
create index profissional_setores_setor_idx on public.profissional_setores (setor_id);

alter table public.profissional_setores enable row level security;

create policy "profissional_setores_select_own"
  on public.profissional_setores
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "profissional_setores_insert_own"
  on public.profissional_setores
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "profissional_setores_update_own"
  on public.profissional_setores
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "profissional_setores_delete_own"
  on public.profissional_setores
  for delete
  to authenticated
  using (auth.uid() = user_id);
