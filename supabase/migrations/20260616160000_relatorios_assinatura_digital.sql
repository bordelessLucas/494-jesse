-- Assinatura digital de relatórios (PAdES) — fase 2 validação jurídica.

alter table public.relatorios_historico
  add column if not exists pdf_assinado_url text,
  add column if not exists profissional_emissor_id uuid references public.profissionais (id) on delete set null,
  add column if not exists assinado_em timestamptz;

comment on column public.relatorios_historico.pdf_assinado_url is
  'Caminho no storage do PDF assinado digitalmente (bucket relatorios_assinados).';
comment on column public.relatorios_historico.profissional_emissor_id is
  'Profissional cujo certificado ICP-Brasil foi usado na assinatura.';
comment on column public.relatorios_historico.assinado_em is
  'Data/hora em que a assinatura digital foi aplicada.';

create index if not exists relatorios_historico_profissional_emissor_idx
  on public.relatorios_historico (profissional_emissor_id);

-- Bucket público para PDFs assinados: {tenant_user_id}/{relatorio_id}.pdf
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'relatorios_assinados',
  'relatorios_assinados',
  true,
  20971520,
  array['application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "relatorios_assinados_select_public" on storage.objects;
create policy "relatorios_assinados_select_public"
  on storage.objects
  for select
  to public
  using (bucket_id = 'relatorios_assinados');

drop policy if exists "relatorios_assinados_insert_service" on storage.objects;
create policy "relatorios_assinados_insert_service"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'relatorios_assinados'
    and split_part(name, '/', 1) = public.auth_tenant_user_id()::text
  );

drop policy if exists "relatorios_assinados_update_service" on storage.objects;
create policy "relatorios_assinados_update_service"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'relatorios_assinados'
    and split_part(name, '/', 1) = public.auth_tenant_user_id()::text
  )
  with check (
    bucket_id = 'relatorios_assinados'
    and split_part(name, '/', 1) = public.auth_tenant_user_id()::text
  );

-- Descriptografia do PIN — apenas service_role (Edge Function).
create or replace function public.descriptografar_pin_certificado(p_senha_criptografada text)
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
  return extensions.pgp_sym_decrypt(decode(p_senha_criptografada, 'base64'), v_chave);
end;
$$;

revoke all on function public.descriptografar_pin_certificado(text) from public;
grant execute on function public.descriptografar_pin_certificado(text) to service_role;

-- Permite ao titular listar certificados ativos dos profissionais da conta (para escolher emissor).
drop policy if exists "certificados_profissionais_select_titular" on public.certificados_profissionais;
create policy "certificados_profissionais_select_titular"
  on public.certificados_profissionais
  for select
  to authenticated
  using (
    tenant_user_id = auth.uid()
    and public.auth_is_titular_conta()
  );

-- Atualização do histórico após assinatura (titular ou membro da conta).
drop policy if exists "relatorios_historico_update_own" on public.relatorios_historico;
create policy "relatorios_historico_update_own"
  on public.relatorios_historico
  for update
  to authenticated
  using (
    auth.uid() = user_id
    or user_id = public.auth_tenant_user_id()
  )
  with check (
    auth.uid() = user_id
    or user_id = public.auth_tenant_user_id()
  );
