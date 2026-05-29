-- Profissional membro pode anunciar/cancelar o próprio plantão no mural.
create policy "plantoes_update_membro_proprio"
  on public.plantoes
  for update
  to authenticated
  using (
    user_id = public.auth_tenant_user_id()
    and profissional_id = public.membro_profissional_id()
  )
  with check (
    user_id = public.auth_tenant_user_id()
    and profissional_id = public.membro_profissional_id()
  );

-- Realtime: detectar quando um plantão entra no mural (toast global).
alter table public.plantoes replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'plantoes'
  ) then
    alter publication supabase_realtime add table public.plantoes;
  end if;
end $$;
