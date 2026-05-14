-- Locais de prestação e setores vinculados.
--
-- Aplicar no Supabase SQL Editor ou via CLI (`supabase db push`).

create table public.locais (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  codigo text not null,
  ativo boolean not null default true,
  nome_fantasia text not null,
  razao_social text,
  cnpj text,
  telefone text,
  cep text,
  rua text,
  numero text,
  complemento text,
  bairro text,
  cidade text not null,
  uf text not null,
  anotacoes text,
  fuso_horario text,
  latitude text,
  longitude text,
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint locais_codigo_unico_por_usuario unique (user_id, codigo),
  constraint locais_uf_tamanho_check check (char_length(uf) = 2)
);

comment on table public.locais is
  'Hospitais, clínicas e demais unidades de prestação vinculadas ao usuário.';

create index locais_user_ativo_idx on public.locais (user_id, ativo);
create index locais_user_cidade_idx on public.locais (user_id, cidade);

alter table public.locais enable row level security;

create policy "locais_select_own"
  on public.locais
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "locais_insert_own"
  on public.locais
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "locais_update_own"
  on public.locais
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "locais_delete_own"
  on public.locais
  for delete
  to authenticated
  using (auth.uid() = user_id);

create table public.setores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  local_id uuid not null references public.locais (id) on delete cascade,
  codigo text not null,
  nome text not null,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint setores_codigo_unico_por_local unique (local_id, codigo)
);

comment on table public.setores is
  'Setores de atendimento vinculados a um local de prestação.';

create index setores_user_local_idx on public.setores (user_id, local_id);
create index setores_user_ativo_idx on public.setores (user_id, ativo);

alter table public.setores enable row level security;

create policy "setores_select_own"
  on public.setores
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "setores_insert_own"
  on public.setores
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "setores_update_own"
  on public.setores
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "setores_delete_own"
  on public.setores
  for delete
  to authenticated
  using (auth.uid() = user_id);
