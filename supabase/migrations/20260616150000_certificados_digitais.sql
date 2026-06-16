-- Certificados digitais (.pfx / .p12) dos profissionais — validação jurídica (fase 1).

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.certificados_profissionais (
  id uuid primary key default gen_random_uuid(),
  tenant_user_id uuid not null references auth.users (id) on delete cascade,
  profissional_id uuid not null references public.profissionais (id) on delete cascade,
  certificado_url text not null,
  senha_criptografada text not null,
  valido_ate timestamptz not null,
  criado_em timestamptz not null default now(),
  constraint certificados_profissionais_profissional_unique unique (profissional_id)
);

comment on table public.certificados_profissionais is
  'Certificados digitais ICP-Brasil (.pfx/.p12) por profissional; PIN armazenado com pgp_sym_encrypt.';

create index if not exists certificados_profissionais_tenant_idx
  on public.certificados_profissionais (tenant_user_id);

alter table public.certificados_profissionais enable row level security;

-- Apenas o profissional membro acede ao próprio registo.
drop policy if exists "certificados_profissionais_select_membro" on public.certificados_profissionais;
create policy "certificados_profissionais_select_membro"
  on public.certificados_profissionais
  for select
  to authenticated
  using (
    tenant_user_id = public.auth_tenant_user_id()
    and profissional_id = public.membro_profissional_id()
  );

drop policy if exists "certificados_profissionais_insert_membro" on public.certificados_profissionais;
create policy "certificados_profissionais_insert_membro"
  on public.certificados_profissionais
  for insert
  to authenticated
  with check (
    tenant_user_id = public.auth_tenant_user_id()
    and profissional_id = public.membro_profissional_id()
  );

drop policy if exists "certificados_profissionais_update_membro" on public.certificados_profissionais;
create policy "certificados_profissionais_update_membro"
  on public.certificados_profissionais
  for update
  to authenticated
  using (
    tenant_user_id = public.auth_tenant_user_id()
    and profissional_id = public.membro_profissional_id()
  )
  with check (
    tenant_user_id = public.auth_tenant_user_id()
    and profissional_id = public.membro_profissional_id()
  );

drop policy if exists "certificados_profissionais_delete_membro" on public.certificados_profissionais;
create policy "certificados_profissionais_delete_membro"
  on public.certificados_profissionais
  for delete
  to authenticated
  using (
    tenant_user_id = public.auth_tenant_user_id()
    and profissional_id = public.membro_profissional_id()
  );

-- Bucket privado: {tenant_user_id}/{profissional_id}/{arquivo.pfx|p12}
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'certificados_seguros',
  'certificados_seguros',
  false,
  5242880,
  array[
    'application/x-pkcs12',
    'application/pkcs12',
    'application/octet-stream'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "certificados_seguros_select" on storage.objects;
create policy "certificados_seguros_select"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'certificados_seguros'
    and split_part(name, '/', 1) = public.auth_tenant_user_id()::text
    and split_part(name, '/', 2) = public.membro_profissional_id()::text
  );

drop policy if exists "certificados_seguros_insert" on storage.objects;
create policy "certificados_seguros_insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'certificados_seguros'
    and split_part(name, '/', 1) = public.auth_tenant_user_id()::text
    and split_part(name, '/', 2) = public.membro_profissional_id()::text
  );

drop policy if exists "certificados_seguros_delete" on storage.objects;
create policy "certificados_seguros_delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'certificados_seguros'
    and split_part(name, '/', 1) = public.auth_tenant_user_id()::text
    and split_part(name, '/', 2) = public.membro_profissional_id()::text
  );

-- Criptografia reversível do PIN (MVP — migrar chave para Supabase Vault em produção).
create or replace function public.criptografar_pin_certificado(p_senha text)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_chave text;
begin
  v_chave := coalesce(
    current_setting('app.certificado_pin_key', true),
    'plantoocheck-mvp-cert-pin-key'
  );
  return encode(extensions.pgp_sym_encrypt(p_senha, v_chave), 'base64');
end;
$$;

revoke all on function public.criptografar_pin_certificado(text) from public;
grant execute on function public.criptografar_pin_certificado(text) to authenticated;

-- Upsert seguro: valida membro, criptografa PIN e substitui registo existente.
create or replace function public.upsert_certificado_profissional(
  p_certificado_url text,
  p_senha_plana text,
  p_valido_ate timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profissional_id uuid;
  v_tenant_user_id uuid;
  v_id uuid;
  v_senha_criptografada text;
begin
  v_profissional_id := public.membro_profissional_id();
  v_tenant_user_id := public.auth_tenant_user_id();

  if v_profissional_id is null then
    raise exception 'Acesso negado: apenas profissionais com login próprio podem registar certificados.';
  end if;

  if p_certificado_url is null or length(trim(p_certificado_url)) = 0 then
    raise exception 'Caminho do certificado inválido.';
  end if;

  if p_senha_plana is null or length(trim(p_senha_plana)) = 0 then
    raise exception 'Informe o PIN/senha do certificado.';
  end if;

  if p_valido_ate is null then
    raise exception 'Data de validade do certificado inválida.';
  end if;

  if split_part(p_certificado_url, '/', 1) <> v_tenant_user_id::text
     or split_part(p_certificado_url, '/', 2) <> v_profissional_id::text then
    raise exception 'Caminho do certificado não corresponde ao profissional autenticado.';
  end if;

  v_senha_criptografada := public.criptografar_pin_certificado(p_senha_plana);

  insert into public.certificados_profissionais (
    tenant_user_id,
    profissional_id,
    certificado_url,
    senha_criptografada,
    valido_ate
  )
  values (
    v_tenant_user_id,
    v_profissional_id,
    p_certificado_url,
    v_senha_criptografada,
    p_valido_ate
  )
  on conflict (profissional_id) do update set
    certificado_url = excluded.certificado_url,
    senha_criptografada = excluded.senha_criptografada,
    valido_ate = excluded.valido_ate,
    criado_em = now()
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.upsert_certificado_profissional(text, text, timestamptz) from public;
grant execute on function public.upsert_certificado_profissional(text, text, timestamptz) to authenticated;
