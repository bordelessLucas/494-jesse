-- Nome do titular (CN) extraído do certificado ICP-Brasil no upload.

alter table public.certificados_profissionais
  add column if not exists titular_certificado text;

comment on column public.certificados_profissionais.titular_certificado is
  'Common Name (CN) do certificado digital, ex.: Pierre de Fermat.';

drop function if exists public.upsert_certificado_profissional(text, text, timestamptz);

create or replace function public.upsert_certificado_profissional(
  p_certificado_url text,
  p_senha_plana text,
  p_valido_ate timestamptz,
  p_titular_certificado text default null
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
    valido_ate,
    titular_certificado
  )
  values (
    v_tenant_user_id,
    v_profissional_id,
    p_certificado_url,
    v_senha_criptografada,
    p_valido_ate,
    nullif(trim(p_titular_certificado), '')
  )
  on conflict (profissional_id) do update set
    certificado_url = excluded.certificado_url,
    senha_criptografada = excluded.senha_criptografada,
    valido_ate = excluded.valido_ate,
    titular_certificado = excluded.titular_certificado,
    criado_em = now()
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.upsert_certificado_profissional(text, text, timestamptz, text) from public;
grant execute on function public.upsert_certificado_profissional(text, text, timestamptz, text) to authenticated;
