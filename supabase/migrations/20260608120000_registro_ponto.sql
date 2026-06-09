-- Registo de ponto eletrónico com geolocalização (check-in / check-out).

create table if not exists public.registro_ponto (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  profissional_id uuid not null references public.profissionais (id) on delete cascade,
  plantao_id uuid not null references public.plantoes (id) on delete cascade,
  entrada_em timestamptz not null,
  saida_em timestamptz,
  latitude_entrada double precision not null,
  longitude_entrada double precision not null,
  latitude_saida double precision,
  longitude_saida double precision,
  distancia_entrada_metros numeric(10, 2),
  distancia_saida_metros numeric(10, 2),
  status text not null default 'validado'
    check (status in ('validado', 'pendente', 'rejeitado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.registro_ponto is
  'Check-in/check-out de plantões com coordenadas GPS do dispositivo.';

create index registro_ponto_profissional_idx
  on public.registro_ponto (profissional_id, entrada_em desc);

create index registro_ponto_plantao_idx
  on public.registro_ponto (plantao_id);

create unique index registro_ponto_plantao_aberto_uidx
  on public.registro_ponto (plantao_id)
  where saida_em is null;

alter table public.registro_ponto enable row level security;

create policy "registro_ponto_select"
  on public.registro_ponto
  for select
  to authenticated
  using (
    user_id = public.auth_tenant_user_id()
    and (
      public.auth_is_titular_conta()
      or profissional_id = public.membro_profissional_id()
    )
  );

create policy "registro_ponto_insert_membro"
  on public.registro_ponto
  for insert
  to authenticated
  with check (
    user_id = public.auth_tenant_user_id()
    and profissional_id = public.membro_profissional_id()
    and status = 'validado'
  );

create policy "registro_ponto_update_membro"
  on public.registro_ponto
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

create policy "registro_ponto_insert_titular"
  on public.registro_ponto
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and public.auth_is_titular_conta()
  );

create policy "registro_ponto_update_titular"
  on public.registro_ponto
  for update
  to authenticated
  using (
    user_id = auth.uid()
    and public.auth_is_titular_conta()
  )
  with check (
    user_id = auth.uid()
    and public.auth_is_titular_conta()
  );

-- Membro com plantão hoje pode ler coordenadas do hospital para geofence.
create policy "locais_select_membro_plantao_hoje"
  on public.locais
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.plantoes p
      join public.contas_membros cm on cm.auth_user_id = auth.uid()
      where p.local_id = locais.id
        and p.profissional_id = cm.profissional_id
        and p.user_id = cm.tenant_user_id
        and p.data_plantao = current_date
    )
  );
