-- No Supabase, pgcrypto vive no schema `extensions`; funções com search_path=public
-- não encontram pgp_sym_encrypt/decrypt sem qualificação explícita.

create extension if not exists pgcrypto with schema extensions;

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

revoke all on function public.criptografar_pin_certificado(text) from public;
grant execute on function public.criptografar_pin_certificado(text) to authenticated;

revoke all on function public.descriptografar_pin_certificado(text) from public;
grant execute on function public.descriptografar_pin_certificado(text) to service_role;
