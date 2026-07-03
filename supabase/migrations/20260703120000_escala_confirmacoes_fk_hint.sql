-- Garante FK explícita para embed PostgREST plantoes → escala_confirmacoes.

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'escala_confirmacoes'
  )
  and not exists (
    select 1
    from pg_constraint
    where conname = 'escala_confirmacoes_plantao_id_fkey'
  ) then
    alter table public.escala_confirmacoes
      add constraint escala_confirmacoes_plantao_id_fkey
      foreign key (plantao_id) references public.plantoes (id) on delete cascade;
  end if;
end $$;
