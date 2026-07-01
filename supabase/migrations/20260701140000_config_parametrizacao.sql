-- Parametrização operacional do tenant (grupos, turnos, status, valores, etc.).

-- ---------------------------------------------------------------------------
-- Grupos (agrupamentos de hospitais/unidades)
-- ---------------------------------------------------------------------------

create table public.config_grupos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  descricao text,
  ordem int not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint config_grupos_user_nome_unique unique (user_id, nome)
);

create index config_grupos_user_idx on public.config_grupos (user_id, ordem, nome);

-- ---------------------------------------------------------------------------
-- Tipos de plantão (turnos padrão)
-- ---------------------------------------------------------------------------

create table public.config_tipos_plantao (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  duracao_horas numeric not null default 12 check (duracao_horas > 0),
  hora_inicio_padrao time,
  hora_fim_padrao time,
  ordem int not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint config_tipos_plantao_user_nome_unique unique (user_id, nome)
);

create index config_tipos_plantao_user_idx on public.config_tipos_plantao (user_id, ordem, nome);

-- ---------------------------------------------------------------------------
-- Situações do plantão (labels de status customizados)
-- ---------------------------------------------------------------------------

create table public.config_situacoes_plantao (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  codigo text not null,
  rotulo text not null,
  cor text not null default '#64748b',
  ordem int not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint config_situacoes_plantao_user_codigo_unique unique (user_id, codigo)
);

create index config_situacoes_plantao_user_idx on public.config_situacoes_plantao (user_id, ordem);

-- ---------------------------------------------------------------------------
-- Valores (precificação dinâmica por hora)
-- ---------------------------------------------------------------------------

create table public.config_valores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  valor_hora numeric not null default 0 check (valor_hora >= 0),
  descricao text,
  ordem int not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint config_valores_user_nome_unique unique (user_id, nome)
);

create index config_valores_user_idx on public.config_valores (user_id, ordem, nome);

-- ---------------------------------------------------------------------------
-- Auto-ajustes (tolerância de ponto eletrônico)
-- ---------------------------------------------------------------------------

create table public.config_auto_ajustes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  tolerancia_entrada_min int not null default 5 check (tolerancia_entrada_min >= 0),
  tolerancia_saida_min int not null default 5 check (tolerancia_saida_min >= 0),
  auto_aprovar boolean not null default false,
  ordem int not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint config_auto_ajustes_user_nome_unique unique (user_id, nome)
);

create index config_auto_ajustes_user_idx on public.config_auto_ajustes (user_id, ordem, nome);

-- ---------------------------------------------------------------------------
-- Tipos de contratação
-- ---------------------------------------------------------------------------

create table public.config_tipos_contratacao (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  descricao text,
  ordem int not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint config_tipos_contratacao_user_nome_unique unique (user_id, nome)
);

create index config_tipos_contratacao_user_idx on public.config_tipos_contratacao (user_id, ordem, nome);

-- ---------------------------------------------------------------------------
-- Habilidades (requisitos técnicos para alocação)
-- ---------------------------------------------------------------------------

create table public.config_habilidades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  descricao text,
  obrigatoria boolean not null default false,
  ordem int not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint config_habilidades_user_nome_unique unique (user_id, nome)
);

create index config_habilidades_user_idx on public.config_habilidades (user_id, ordem, nome);

-- ---------------------------------------------------------------------------
-- RLS (leitura tenant; escrita titular)
-- ---------------------------------------------------------------------------

alter table public.config_grupos enable row level security;
alter table public.config_tipos_plantao enable row level security;
alter table public.config_situacoes_plantao enable row level security;
alter table public.config_valores enable row level security;
alter table public.config_auto_ajustes enable row level security;
alter table public.config_tipos_contratacao enable row level security;
alter table public.config_habilidades enable row level security;

create policy "config_grupos_select" on public.config_grupos
  for select to authenticated
  using (user_id = public.auth_tenant_user_id());

create policy "config_grupos_write" on public.config_grupos
  for all to authenticated
  using (user_id = public.auth_tenant_user_id() and public.auth_is_titular_conta())
  with check (user_id = public.auth_tenant_user_id() and public.auth_is_titular_conta());

create policy "config_tipos_plantao_select" on public.config_tipos_plantao
  for select to authenticated
  using (user_id = public.auth_tenant_user_id());

create policy "config_tipos_plantao_write" on public.config_tipos_plantao
  for all to authenticated
  using (user_id = public.auth_tenant_user_id() and public.auth_is_titular_conta())
  with check (user_id = public.auth_tenant_user_id() and public.auth_is_titular_conta());

create policy "config_situacoes_plantao_select" on public.config_situacoes_plantao
  for select to authenticated
  using (user_id = public.auth_tenant_user_id());

create policy "config_situacoes_plantao_write" on public.config_situacoes_plantao
  for all to authenticated
  using (user_id = public.auth_tenant_user_id() and public.auth_is_titular_conta())
  with check (user_id = public.auth_tenant_user_id() and public.auth_is_titular_conta());

create policy "config_valores_select" on public.config_valores
  for select to authenticated
  using (user_id = public.auth_tenant_user_id());

create policy "config_valores_write" on public.config_valores
  for all to authenticated
  using (user_id = public.auth_tenant_user_id() and public.auth_is_titular_conta())
  with check (user_id = public.auth_tenant_user_id() and public.auth_is_titular_conta());

create policy "config_auto_ajustes_select" on public.config_auto_ajustes
  for select to authenticated
  using (user_id = public.auth_tenant_user_id());

create policy "config_auto_ajustes_write" on public.config_auto_ajustes
  for all to authenticated
  using (user_id = public.auth_tenant_user_id() and public.auth_is_titular_conta())
  with check (user_id = public.auth_tenant_user_id() and public.auth_is_titular_conta());

create policy "config_tipos_contratacao_select" on public.config_tipos_contratacao
  for select to authenticated
  using (user_id = public.auth_tenant_user_id());

create policy "config_tipos_contratacao_write" on public.config_tipos_contratacao
  for all to authenticated
  using (user_id = public.auth_tenant_user_id() and public.auth_is_titular_conta())
  with check (user_id = public.auth_tenant_user_id() and public.auth_is_titular_conta());

create policy "config_habilidades_select" on public.config_habilidades
  for select to authenticated
  using (user_id = public.auth_tenant_user_id());

create policy "config_habilidades_write" on public.config_habilidades
  for all to authenticated
  using (user_id = public.auth_tenant_user_id() and public.auth_is_titular_conta())
  with check (user_id = public.auth_tenant_user_id() and public.auth_is_titular_conta());
