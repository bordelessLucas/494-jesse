-- Motor de notificações reais (PostgreSQL + Realtime).

create table public.notificacoes (
  id uuid primary key default gen_random_uuid(),
  tenant_user_id uuid not null references auth.users (id) on delete cascade,
  usuario_id uuid not null references auth.users (id) on delete cascade,
  titulo text not null,
  mensagem text not null,
  tipo text not null,
  lida boolean not null default false,
  link_acao text null,
  criado_em timestamptz not null default now()
);

comment on table public.notificacoes is
  'Notificações in-app por utilizador (titular ou membro profissional).';

comment on column public.notificacoes.usuario_id is
  'auth.users.id do destinatário da notificação.';

create index notificacoes_usuario_criado_idx
  on public.notificacoes (usuario_id, criado_em desc);

create index notificacoes_tenant_idx
  on public.notificacoes (tenant_user_id);

alter table public.notificacoes enable row level security;

create policy "notificacoes_select_own"
  on public.notificacoes
  for select
  to authenticated
  using (usuario_id = auth.uid());

create policy "notificacoes_update_own"
  on public.notificacoes
  for update
  to authenticated
  using (usuario_id = auth.uid())
  with check (usuario_id = auth.uid());

-- Titular/coordenação pode notificar membros da conta.
create policy "notificacoes_insert_titular"
  on public.notificacoes
  for insert
  to authenticated
  with check (
    tenant_user_id = public.auth_tenant_user_id()
    and public.auth_is_titular_conta()
  );

-- Utilizador pode criar notificação para si (ex.: alertas locais sincronizados).
create policy "notificacoes_insert_self"
  on public.notificacoes
  for insert
  to authenticated
  with check (
    usuario_id = auth.uid()
    and tenant_user_id = public.auth_tenant_user_id()
  );

-- Realtime: push de novas notificações ao destinatário.
alter table public.notificacoes replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notificacoes'
  ) then
    alter publication supabase_realtime add table public.notificacoes;
  end if;
end $$;
