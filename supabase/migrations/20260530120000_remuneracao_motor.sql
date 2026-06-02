-- Motor de remuneração: tipos de plantão, acréscimos e feriados.

create table if not exists public.remuneracao_tipos_plantao (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  descricao text,
  /** Multiplicador sobre o valor base do plantão (1 = 100%, 1.2 = +20%). */
  multiplicador numeric(8, 4) not null default 1,
  ativo boolean not null default true,
  ordem int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.remuneracao_acrescimos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  tipo_calculo text not null check (
    tipo_calculo in ('percentual', 'valor_fixo_hora', 'valor_fixo_plantao')
  ),
  valor numeric(14, 4) not null default 0,
  gatilho text not null check (
    gatilho in ('fim_de_semana', 'feriado', 'especialidade')
  ),
  /** Para gatilho especialidade: texto contido em profissionais.detalhes->especialidade (case insensitive). */
  especialidade_contem text,
  ativo boolean not null default true,
  ordem int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.remuneracao_feriados (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  data_feriado date not null,
  nome text not null default 'Feriado',
  created_at timestamptz not null default now(),
  constraint remuneracao_feriados_unique unique (user_id, data_feriado)
);

alter table public.plantoes
  add column if not exists remuneracao_tipo_id uuid references public.remuneracao_tipos_plantao (id) on delete set null;

create index remuneracao_tipos_user_idx on public.remuneracao_tipos_plantao (user_id, ativo);
create index remuneracao_acrescimos_user_idx on public.remuneracao_acrescimos (user_id, ativo);
create index remuneracao_feriados_user_data_idx on public.remuneracao_feriados (user_id, data_feriado);

alter table public.remuneracao_tipos_plantao enable row level security;
alter table public.remuneracao_acrescimos enable row level security;
alter table public.remuneracao_feriados enable row level security;

create policy "remuneracao_tipos_select"
  on public.remuneracao_tipos_plantao for select to authenticated
  using (user_id = public.auth_tenant_user_id());

create policy "remuneracao_tipos_mutate"
  on public.remuneracao_tipos_plantao for all to authenticated
  using (user_id = auth.uid() and public.auth_is_titular_conta())
  with check (user_id = auth.uid() and public.auth_is_titular_conta());

create policy "remuneracao_acrescimos_select"
  on public.remuneracao_acrescimos for select to authenticated
  using (user_id = public.auth_tenant_user_id());

create policy "remuneracao_acrescimos_mutate"
  on public.remuneracao_acrescimos for all to authenticated
  using (user_id = auth.uid() and public.auth_is_titular_conta())
  with check (user_id = auth.uid() and public.auth_is_titular_conta());

create policy "remuneracao_feriados_select"
  on public.remuneracao_feriados for select to authenticated
  using (user_id = public.auth_tenant_user_id());

create policy "remuneracao_feriados_mutate"
  on public.remuneracao_feriados for all to authenticated
  using (user_id = auth.uid() and public.auth_is_titular_conta())
  with check (user_id = auth.uid() and public.auth_is_titular_conta());
