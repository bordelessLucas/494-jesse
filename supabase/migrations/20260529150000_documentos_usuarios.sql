-- Documentos de profissionais (PDF) + bucket Storage + validação de conselho na escala.

create table if not exists public.documentos_usuarios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  profissional_id uuid not null references public.profissionais (id) on delete cascade,
  tipo text not null check (tipo in ('contrato', 'crm', 'coren')),
  nome_arquivo text not null,
  storage_path text not null,
  mime_type text not null default 'application/pdf',
  status text not null default 'pendente'
    check (status in ('pendente', 'validado', 'rejeitado')),
  motivo_rejeicao text,
  uploaded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.documentos_usuarios is
  'PDFs enviados por profissionais (contrato, CRM, COREN) com fluxo de validação pelo titular.';

create index documentos_usuarios_profissional_idx
  on public.documentos_usuarios (profissional_id, tipo, status);
create index documentos_usuarios_user_idx
  on public.documentos_usuarios (user_id, status);

alter table public.documentos_usuarios enable row level security;

-- Leitura: titular da conta ou membro no próprio profissional.
create policy "documentos_usuarios_select"
  on public.documentos_usuarios
  for select
  to authenticated
  using (
    user_id = public.auth_tenant_user_id()
    and (
      public.auth_is_titular_conta()
      or profissional_id = public.membro_profissional_id()
    )
  );

-- Upload: titular (qualquer profissional da conta) ou membro (só o próprio).
create policy "documentos_usuarios_insert"
  on public.documentos_usuarios
  for insert
  to authenticated
  with check (
    user_id = public.auth_tenant_user_id()
    and status = 'pendente'
    and (
      public.auth_is_titular_conta()
      or profissional_id = public.membro_profissional_id()
    )
  );

-- Validação / rejeição: apenas titular.
create policy "documentos_usuarios_update_titular"
  on public.documentos_usuarios
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

-- Exclusão: titular ou membro (documentos próprios pendentes/rejeitados).
create policy "documentos_usuarios_delete"
  on public.documentos_usuarios
  for delete
  to authenticated
  using (
    user_id = public.auth_tenant_user_id()
    and (
      public.auth_is_titular_conta()
      or (
        profissional_id = public.membro_profissional_id()
        and status in ('pendente', 'rejeitado')
      )
    )
  );

-- Bucket privado: {tenant_user_id}/{profissional_id}/{arquivo.pdf}
insert into storage.buckets (id, name, public)
values ('documentos_profissionais', 'documentos_profissionais', false)
on conflict (id) do update set public = excluded.public;

create policy "documentos_profissionais_select"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'documentos_profissionais'
    and split_part(name, '/', 1) = public.auth_tenant_user_id()::text
    and (
      public.auth_is_titular_conta()
      or split_part(name, '/', 2) = public.membro_profissional_id()::text
    )
  );

create policy "documentos_profissionais_insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'documentos_profissionais'
    and split_part(name, '/', 1) = public.auth_tenant_user_id()::text
    and (
      public.auth_is_titular_conta()
      or split_part(name, '/', 2) = public.membro_profissional_id()::text
    )
  );

create policy "documentos_profissionais_delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'documentos_profissionais'
    and split_part(name, '/', 1) = public.auth_tenant_user_id()::text
    and (
      public.auth_is_titular_conta()
      or split_part(name, '/', 2) = public.membro_profissional_id()::text
    )
  );

-- Tipo de documento de conselho exigido conforme sigla do profissional.
create or replace function public.tipo_conselho_documento(p_profissional_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when upper(coalesce(p.sigla_conselho, '')) like '%COREN%' then 'coren'
    else 'crm'
  end
  from public.profissionais p
  where p.id = p_profissional_id;
$$;

create or replace function public.profissional_conselho_validado(p_profissional_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.documentos_usuarios d
    where d.profissional_id = p_profissional_id
      and d.status = 'validado'
      and d.tipo = public.tipo_conselho_documento(p_profissional_id)
  );
$$;

create or replace function public.plantoes_validar_documentos_profissional()
returns trigger
language plpgsql
as $$
begin
  if new.profissional_id is not null
     and not public.profissional_conselho_validado(new.profissional_id) then
    raise exception
      'Atenção: Este profissional possui pendências documentais e não pode assumir plantões até à validação do conselho.';
  end if;
  return new;
end;
$$;

drop trigger if exists plantoes_validar_documentos_profissional_trg on public.plantoes;

create trigger plantoes_validar_documentos_profissional_trg
  before insert or update of profissional_id
  on public.plantoes
  for each row
  execute function public.plantoes_validar_documentos_profissional();
