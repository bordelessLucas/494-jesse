-- Membros profissionais podem ver todos os plantões anunciados no mural do tenant.
create policy "plantoes_select_mural_membro"
  on public.plantoes
  for select
  to authenticated
  using (
    disponivel_mural = true
    and user_id = public.auth_tenant_user_id()
    and exists (
      select 1
      from public.contas_membros cm
      where cm.auth_user_id = auth.uid()
    )
  );
