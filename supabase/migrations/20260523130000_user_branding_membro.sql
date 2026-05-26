-- Membros (profissionais convidados) podem ler a marca do titular da conta.

create policy "user_branding_select_membro_tenant"
  on public.user_branding
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.contas_membros cm
      where cm.auth_user_id = auth.uid()
        and cm.tenant_user_id = user_branding.user_id
    )
  );
