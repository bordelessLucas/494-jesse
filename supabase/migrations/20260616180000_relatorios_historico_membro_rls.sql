-- Membros profissionais emitem relatórios com user_id = tenant (titular);
-- políticas antigas só permitiam auth.uid() = user_id.

drop policy if exists "relatorios_historico_select_own" on public.relatorios_historico;
drop policy if exists "relatorios_historico_insert_own" on public.relatorios_historico;
drop policy if exists "relatorios_historico_delete_own" on public.relatorios_historico;
drop policy if exists "relatorios_historico_select_tenant" on public.relatorios_historico;
drop policy if exists "relatorios_historico_insert_tenant" on public.relatorios_historico;
drop policy if exists "relatorios_historico_delete_tenant" on public.relatorios_historico;

create policy "relatorios_historico_select_tenant"
  on public.relatorios_historico
  for select
  to authenticated
  using (
    auth.uid() = user_id
    or user_id = public.auth_tenant_user_id()
  );

create policy "relatorios_historico_insert_tenant"
  on public.relatorios_historico
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    or user_id = public.auth_tenant_user_id()
  );

create policy "relatorios_historico_delete_tenant"
  on public.relatorios_historico
  for delete
  to authenticated
  using (
    auth.uid() = user_id
    or user_id = public.auth_tenant_user_id()
  );
