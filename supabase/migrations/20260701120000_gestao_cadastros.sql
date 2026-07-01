-- Cadastros de Gestão: tipos de serviço (SCIH / UTI) e metadados de membros.

alter table public.contas_membros
  add column if not exists nome text,
  add column if not exists email text;

comment on column public.contas_membros.nome is
  'Nome de exibição do membro (auditor/faturista ou coordenador sem profissional vinculado).';
comment on column public.contas_membros.email is
  'E-mail de login do membro para listagens na área de Gestão.';

-- ---------------------------------------------------------------------------
-- Tipos de serviço (SCIH, UTI Adulto, UTI Pediátrica)
-- ---------------------------------------------------------------------------

create table public.gestao_tipos_servico (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  slug text not null
    check (slug in ('scih', 'uti_adulto', 'uti_pediatrica')),
  titulo text not null,
  observacoes text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gestao_tipos_servico_user_slug_unique unique (user_id, slug)
);

comment on table public.gestao_tipos_servico is
  'Configuração por tipo de serviço hospitalar na área de Cadastros (Gestão).';

create index gestao_tipos_servico_user_idx on public.gestao_tipos_servico (user_id);

create table public.gestao_tipo_servico_acrescimos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tipo_servico_id uuid not null references public.gestao_tipos_servico (id) on delete cascade,
  especialidade text not null,
  tipo_calculo text not null default 'percentual'
    check (tipo_calculo in ('percentual', 'valor_fixo_hora', 'valor_fixo_plantao')),
  valor numeric not null default 0,
  ativo boolean not null default true,
  ordem int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.gestao_tipo_servico_acrescimos is
  'Regras de acréscimo por especialidade vinculadas a um tipo de serviço.';

create index gestao_tipo_servico_acrescimos_tipo_idx on public.gestao_tipo_servico_acrescimos (tipo_servico_id);

create table public.gestao_tipo_servico_setores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tipo_servico_id uuid not null references public.gestao_tipos_servico (id) on delete cascade,
  setor_id uuid not null references public.setores (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (tipo_servico_id, setor_id)
);

comment on table public.gestao_tipo_servico_setores is
  'Vínculo entre tipo de serviço e setores hospitalares.';

create index gestao_tipo_servico_setores_tipo_idx on public.gestao_tipo_servico_setores (tipo_servico_id);

-- RLS
alter table public.gestao_tipos_servico enable row level security;
alter table public.gestao_tipo_servico_acrescimos enable row level security;
alter table public.gestao_tipo_servico_setores enable row level security;

create policy "gestao_tipos_servico_tenant"
  on public.gestao_tipos_servico
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "gestao_tipo_servico_acrescimos_tenant"
  on public.gestao_tipo_servico_acrescimos
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "gestao_tipo_servico_setores_tenant"
  on public.gestao_tipo_servico_setores
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
