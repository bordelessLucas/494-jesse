-- Workflow Unique Gestor: estados de relatório, anexos e perfis auditor/faturista.

-- ---------------------------------------------------------------------------
-- Perfis em contas_membros
-- ---------------------------------------------------------------------------

alter table public.contas_membros
  alter column profissional_id drop not null;

alter table public.contas_membros
  drop constraint if exists contas_membros_role_check;

alter table public.contas_membros
  add constraint contas_membros_role_check
  check (role in ('profissional', 'auditor', 'faturista'));

alter table public.contas_membros
  drop constraint if exists contas_membros_profissional_role_chk;

alter table public.contas_membros
  add constraint contas_membros_profissional_role_chk
  check (
    (role = 'profissional' and profissional_id is not null)
    or role in ('auditor', 'faturista')
  );

comment on column public.contas_membros.role is
  'Papel do membro na conta: profissional (escala/plantão), auditor (aprovação de relatórios) ou faturista (faturação).';

-- ---------------------------------------------------------------------------
-- Colunas de workflow em relatorios_historico
-- ---------------------------------------------------------------------------

alter table public.relatorios_historico
  add column if not exists status_workflow text not null default 'rascunho'
    check (
      status_workflow in ('rascunho', 'em_auditoria', 'aprovado', 'faturado')
    ),
  add column if not exists anexos_urls text[] not null default '{}'::text[],
  add column if not exists auditor_id uuid references auth.users (id) on delete set null,
  add column if not exists faturista_id uuid references auth.users (id) on delete set null;

comment on column public.relatorios_historico.status_workflow is
  'Estado do relatório no fluxo Unique Gestor: rascunho → em_auditoria → aprovado → faturado.';
comment on column public.relatorios_historico.anexos_urls is
  'URLs dos documentos de juntada associados ao relatório.';
comment on column public.relatorios_historico.auditor_id is
  'Utilizador Auth que aprovou o relatório na etapa de auditoria.';
comment on column public.relatorios_historico.faturista_id is
  'Utilizador Auth que concluiu a faturação do relatório.';

create index if not exists relatorios_historico_status_workflow_idx
  on public.relatorios_historico (status_workflow);

create index if not exists relatorios_historico_auditor_id_idx
  on public.relatorios_historico (auditor_id);

create index if not exists relatorios_historico_faturista_id_idx
  on public.relatorios_historico (faturista_id);

-- ---------------------------------------------------------------------------
-- Helpers de papel (RLS)
-- ---------------------------------------------------------------------------

create or replace function public.auth_membro_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select cm.role
  from public.contas_membros cm
  where cm.auth_user_id = auth.uid()
  limit 1;
$$;

comment on function public.auth_membro_role() is
  'Role do membro autenticado em contas_membros (null para titular/master).';

create or replace function public.auth_is_auditor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.auth_membro_role() = 'auditor';
$$;

create or replace function public.auth_is_faturista()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.auth_membro_role() = 'faturista';
$$;

create or replace function public.auth_is_coordenador_workflow()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.auth_is_titular_conta()
    or coalesce(public.auth_membro_role(), '') not in ('auditor', 'faturista');
$$;

comment on function public.auth_is_coordenador_workflow() is
  'Titular ou membro que pode emitir/editar relatórios (não auditor nem faturista).';

-- ---------------------------------------------------------------------------
-- RLS relatorios_historico — substitui políticas anteriores
-- ---------------------------------------------------------------------------

drop policy if exists "relatorios_historico_select_own" on public.relatorios_historico;
drop policy if exists "relatorios_historico_insert_own" on public.relatorios_historico;
drop policy if exists "relatorios_historico_delete_own" on public.relatorios_historico;
drop policy if exists "relatorios_historico_select_tenant" on public.relatorios_historico;
drop policy if exists "relatorios_historico_insert_tenant" on public.relatorios_historico;
drop policy if exists "relatorios_historico_delete_tenant" on public.relatorios_historico;
drop policy if exists "relatorios_historico_update_own" on public.relatorios_historico;

-- Coordenador / titular: visualiza relatórios do tenant.
create policy "relatorios_historico_select_coordenador"
  on public.relatorios_historico
  for select
  to authenticated
  using (
    (
      auth.uid() = user_id
      or user_id = public.auth_tenant_user_id()
    )
    and public.auth_is_coordenador_workflow()
  );

-- Auditor: relatórios em auditoria ou já aprovados/faturados.
create policy "relatorios_historico_select_auditor"
  on public.relatorios_historico
  for select
  to authenticated
  using (
    user_id = public.auth_tenant_user_id()
    and public.auth_is_auditor()
    and status_workflow in ('em_auditoria', 'aprovado', 'faturado')
  );

-- Faturista: apenas relatórios aprovados ou faturados.
create policy "relatorios_historico_select_faturista"
  on public.relatorios_historico
  for select
  to authenticated
  using (
    user_id = public.auth_tenant_user_id()
    and public.auth_is_faturista()
    and status_workflow in ('aprovado', 'faturado')
  );

-- Coordenador / titular: cria relatórios no tenant.
create policy "relatorios_historico_insert_coordenador"
  on public.relatorios_historico
  for insert
  to authenticated
  with check (
    (
      auth.uid() = user_id
      or user_id = public.auth_tenant_user_id()
    )
    and public.auth_is_coordenador_workflow()
  );

-- Coordenador / titular: edita apenas rascunhos (pode submeter para auditoria).
create policy "relatorios_historico_update_coordenador_rascunho"
  on public.relatorios_historico
  for update
  to authenticated
  using (
    (
      auth.uid() = user_id
      or user_id = public.auth_tenant_user_id()
    )
    and public.auth_is_coordenador_workflow()
    and status_workflow = 'rascunho'
  )
  with check (
    (
      auth.uid() = user_id
      or user_id = public.auth_tenant_user_id()
    )
    and public.auth_is_coordenador_workflow()
    and status_workflow in ('rascunho', 'em_auditoria')
  );

-- Titular: atualização irrestrita (gestão completa do tenant).
create policy "relatorios_historico_update_titular"
  on public.relatorios_historico
  for update
  to authenticated
  using (
    auth.uid() = user_id
    and public.auth_is_titular_conta()
  )
  with check (
    auth.uid() = user_id
    and public.auth_is_titular_conta()
  );

-- Auditor: atualiza estado e regista aprovação.
create policy "relatorios_historico_update_auditor"
  on public.relatorios_historico
  for update
  to authenticated
  using (
    user_id = public.auth_tenant_user_id()
    and public.auth_is_auditor()
    and status_workflow in ('em_auditoria', 'aprovado', 'faturado')
  )
  with check (
    user_id = public.auth_tenant_user_id()
    and public.auth_is_auditor()
    and status_workflow in ('em_auditoria', 'aprovado', 'faturado')
  );

-- Faturista: atualiza estado e regista faturação.
create policy "relatorios_historico_update_faturista"
  on public.relatorios_historico
  for update
  to authenticated
  using (
    user_id = public.auth_tenant_user_id()
    and public.auth_is_faturista()
    and status_workflow in ('aprovado', 'faturado')
  )
  with check (
    user_id = public.auth_tenant_user_id()
    and public.auth_is_faturista()
    and status_workflow in ('aprovado', 'faturado')
  );

-- Coordenador / titular: remove apenas rascunhos.
create policy "relatorios_historico_delete_coordenador_rascunho"
  on public.relatorios_historico
  for delete
  to authenticated
  using (
    (
      auth.uid() = user_id
      or user_id = public.auth_tenant_user_id()
    )
    and public.auth_is_coordenador_workflow()
    and status_workflow = 'rascunho'
  );
