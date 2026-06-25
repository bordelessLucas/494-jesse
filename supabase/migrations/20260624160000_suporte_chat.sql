-- Chat de suporte multi-tenant: conversas, mensagens, fluxo guiado e FAQ.

-- ---------------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------------

create table public.suporte_fluxos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  mensagem text not null,
  tipo text not null default 'menu'
    check (tipo in ('menu', 'resposta_final', 'abrir_ticket')),
  slug text unique,
  criado_em timestamptz not null default now()
);

comment on table public.suporte_fluxos is
  'Nós da árvore de decisão do suporte (global da plataforma).';

create table public.suporte_fluxo_opcoes (
  id uuid primary key default gen_random_uuid(),
  fluxo_id uuid not null references public.suporte_fluxos (id) on delete cascade,
  label text not null,
  proximo_fluxo_id uuid references public.suporte_fluxos (id) on delete set null,
  ordem integer not null default 0,
  criado_em timestamptz not null default now()
);

create index suporte_fluxo_opcoes_fluxo_idx
  on public.suporte_fluxo_opcoes (fluxo_id, ordem);

create table public.suporte_conversas (
  id uuid primary key default gen_random_uuid(),
  tenant_user_id uuid not null references auth.users (id) on delete cascade,
  usuario_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'aguardando_usuario'
    check (status in ('aberta', 'aguardando_usuario', 'resolvida')),
  fluxo_atual_id uuid references public.suporte_fluxos (id) on delete set null,
  criada_em timestamptz not null default now(),
  atualizada_em timestamptz not null default now()
);

comment on column public.suporte_conversas.tenant_user_id is
  'ID do titular (MASTER) da empresa — padrão multi-tenant do PlantãoCheck.';

comment on column public.suporte_conversas.usuario_id is
  'auth.users.id de quem abriu o atendimento (titular ou membro).';

create index suporte_conversas_tenant_idx
  on public.suporte_conversas (tenant_user_id, atualizada_em desc);

create index suporte_conversas_usuario_idx
  on public.suporte_conversas (usuario_id, atualizada_em desc);

-- Uma conversa ativa (não resolvida) por usuário.
create unique index suporte_conversas_usuario_ativa_uidx
  on public.suporte_conversas (usuario_id)
  where status <> 'resolvida';

create table public.suporte_mensagens (
  id uuid primary key default gen_random_uuid(),
  conversa_id uuid not null references public.suporte_conversas (id) on delete cascade,
  autor_tipo text not null check (autor_tipo in ('usuario', 'analista', 'sistema')),
  autor_id uuid references auth.users (id) on delete set null,
  texto text not null,
  fluxo_opcao_id uuid references public.suporte_fluxo_opcoes (id) on delete set null,
  criada_em timestamptz not null default now()
);

create index suporte_mensagens_conversa_idx
  on public.suporte_mensagens (conversa_id, criada_em asc);

create table public.suporte_artigos (
  id uuid primary key default gen_random_uuid(),
  tenant_user_id uuid references auth.users (id) on delete cascade,
  titulo text not null,
  palavras_chave text[] not null default '{}',
  conteudo text not null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

comment on column public.suporte_artigos.tenant_user_id is
  'NULL = artigo global da plataforma; preenchido = FAQ específica do tenant.';

create index suporte_artigos_tenant_idx
  on public.suporte_artigos (tenant_user_id)
  where ativo = true;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create or replace function public.suporte_conversas_touch_atualizada_em()
returns trigger
language plpgsql
as $$
begin
  new.atualizada_em := now();
  return new;
end;
$$;

create trigger suporte_conversas_atualizada_em
  before update on public.suporte_conversas
  for each row
  execute function public.suporte_conversas_touch_atualizada_em();

create or replace function public.suporte_mensagens_touch_conversa()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.suporte_conversas
  set atualizada_em = now()
  where id = new.conversa_id;
  return new;
end;
$$;

create trigger suporte_mensagens_atualiza_conversa
  after insert on public.suporte_mensagens
  for each row
  execute function public.suporte_mensagens_touch_conversa();

-- Notifica o titular quando conversa escala para atendimento humano.
create or replace function public.suporte_notificar_master_escalacao()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'aberta'
     and (tg_op = 'INSERT' or old.status is distinct from new.status)
     and new.usuario_id <> new.tenant_user_id then
    insert into public.notificacoes (
      tenant_user_id,
      usuario_id,
      titulo,
      mensagem,
      tipo,
      link_acao
    )
    values (
      new.tenant_user_id,
      new.tenant_user_id,
      'Novo chamado de suporte',
      'Um usuário solicitou atendimento humano no chat de suporte.',
      'suporte',
      '/admin/suporte?conversa=' || new.id::text
    );
  elsif new.status = 'aberta'
        and (tg_op = 'INSERT' or old.status is distinct from new.status)
        and new.usuario_id = new.tenant_user_id then
    -- Titular abrindo ticket: notificação opcional para si (inbox).
    null;
  end if;
  return new;
end;
$$;

create trigger suporte_conversas_notificar_escalacao
  after insert or update of status on public.suporte_conversas
  for each row
  execute function public.suporte_notificar_master_escalacao();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.suporte_fluxos enable row level security;
alter table public.suporte_fluxo_opcoes enable row level security;
alter table public.suporte_conversas enable row level security;
alter table public.suporte_mensagens enable row level security;
alter table public.suporte_artigos enable row level security;

-- Fluxos globais: leitura para autenticados.
create policy "suporte_fluxos_select_auth"
  on public.suporte_fluxos for select to authenticated
  using (true);

create policy "suporte_fluxo_opcoes_select_auth"
  on public.suporte_fluxo_opcoes for select to authenticated
  using (true);

-- Conversas: dono da conversa ou titular (analista) do tenant.
create policy "suporte_conversas_select"
  on public.suporte_conversas for select to authenticated
  using (
    usuario_id = auth.uid()
    or (
      tenant_user_id = public.auth_tenant_user_id()
      and public.auth_is_titular_conta()
    )
  );

create policy "suporte_conversas_insert"
  on public.suporte_conversas for insert to authenticated
  with check (
    usuario_id = auth.uid()
    and tenant_user_id = public.auth_tenant_user_id()
  );

create policy "suporte_conversas_update"
  on public.suporte_conversas for update to authenticated
  using (
    usuario_id = auth.uid()
    or (
      tenant_user_id = public.auth_tenant_user_id()
      and public.auth_is_titular_conta()
    )
  )
  with check (
    tenant_user_id = public.auth_tenant_user_id()
  );

-- Mensagens: via conversa acessível.
create policy "suporte_mensagens_select"
  on public.suporte_mensagens for select to authenticated
  using (
    exists (
      select 1 from public.suporte_conversas c
      where c.id = conversa_id
        and (
          c.usuario_id = auth.uid()
          or (
            c.tenant_user_id = public.auth_tenant_user_id()
            and public.auth_is_titular_conta()
          )
        )
    )
  );

create policy "suporte_mensagens_insert"
  on public.suporte_mensagens for insert to authenticated
  with check (
    exists (
      select 1 from public.suporte_conversas c
      where c.id = conversa_id
        and c.status <> 'resolvida'
        and (
          (
            autor_tipo = 'usuario'
            and c.usuario_id = auth.uid()
            and autor_id = auth.uid()
          )
          or (
            autor_tipo = 'analista'
            and c.tenant_user_id = public.auth_tenant_user_id()
            and public.auth_is_titular_conta()
            and autor_id = auth.uid()
          )
          or (
            autor_tipo = 'sistema'
            and c.usuario_id = auth.uid()
            and autor_id is null
          )
        )
    )
  );

-- FAQ: artigos globais ou do tenant.
create policy "suporte_artigos_select"
  on public.suporte_artigos for select to authenticated
  using (
    ativo = true
    and (
      tenant_user_id is null
      or tenant_user_id = public.auth_tenant_user_id()
    )
  );

create policy "suporte_artigos_manage_master"
  on public.suporte_artigos for all to authenticated
  using (
    public.auth_is_titular_conta()
    and (tenant_user_id is null or tenant_user_id = public.auth_tenant_user_id())
  )
  with check (
    public.auth_is_titular_conta()
    and (tenant_user_id is null or tenant_user_id = public.auth_tenant_user_id())
  );

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------

alter table public.suporte_mensagens replica identity full;
alter table public.suporte_conversas replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'suporte_mensagens'
  ) then
    alter publication supabase_realtime add table public.suporte_mensagens;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'suporte_conversas'
  ) then
    alter publication supabase_realtime add table public.suporte_conversas;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Seeds: árvore de decisão padrão + FAQ global
-- ---------------------------------------------------------------------------

insert into public.suporte_fluxos (id, titulo, mensagem, tipo, slug) values
  (
    'a1000000-0000-4000-8000-000000000001',
    'Raiz',
    'Olá! Sou o assistente do **PlantãoCheck**. Escolha um assunto abaixo ou descreva sua dúvida.',
    'menu',
    'raiz'
  ),
  (
    'a1000000-0000-4000-8000-000000000002',
    'Plantões e escalas',
    'Para **escalas**, acesse o menu Escalas (mensal, semanal ou modelos). Para trocas, use o Mural de Trocas. Precisa de mais ajuda?',
    'resposta_final',
    null
  ),
  (
    'a1000000-0000-4000-8000-000000000003',
    'Financeiro',
    'Extratos e repasses ficam em **Financeiro**. Se algo não conferir, envie competência e print da tela para o analista.',
    'resposta_final',
    null
  ),
  (
    'a1000000-0000-4000-8000-000000000004',
    'Cadastro',
    'Cadastros de profissionais e locais estão em **Usuários** e **Configurações**. Campos obrigatórios: nome, conselho, e-mail e vínculo com local/setor.',
    'resposta_final',
    null
  ),
  (
    'a1000000-0000-4000-8000-000000000005',
    'Atendimento humano',
    'Encaminhei seu pedido para um analista. Você será atendido em breve neste mesmo chat.',
    'abrir_ticket',
    null
  );

insert into public.suporte_fluxo_opcoes (id, fluxo_id, label, proximo_fluxo_id, ordem) values
  (
    'b1000000-0000-4000-8000-000000000001',
    'a1000000-0000-4000-8000-000000000001',
    'Plantões e escalas',
    'a1000000-0000-4000-8000-000000000002',
    1
  ),
  (
    'b1000000-0000-4000-8000-000000000002',
    'a1000000-0000-4000-8000-000000000001',
    'Financeiro / repasses',
    'a1000000-0000-4000-8000-000000000003',
    2
  ),
  (
    'b1000000-0000-4000-8000-000000000003',
    'a1000000-0000-4000-8000-000000000001',
    'Cadastro de usuários',
    'a1000000-0000-4000-8000-000000000004',
    3
  ),
  (
    'b1000000-0000-4000-8000-000000000004',
    'a1000000-0000-4000-8000-000000000001',
    'Falar com um analista',
    'a1000000-0000-4000-8000-000000000005',
    4
  );

insert into public.suporte_artigos (tenant_user_id, titulo, palavras_chave, conteudo) values
  (
    null,
    'Como confirmar um plantão',
    array['confirmar', 'confirmação', 'plantão', 'agenda'],
    'Acesse **Minha Agenda**, localize o plantão pendente e use o botão Confirmar ou Recusar.'
  ),
  (
    null,
    'Extrato financeiro',
    array['extrato', 'financeiro', 'pagamento', 'repasse'],
    'Em **Financeiro → Extratos** você visualiza valores por competência. Repasses ficam em Financeiro → Repasses.'
  ),
  (
    null,
    'Registrar ponto',
    array['ponto', 'check-in', 'gps', 'entrada'],
    'No menu **Ponto**, faça check-in/check-out com GPS habilitado dentro do raio do local.'
  );
