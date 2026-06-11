-- Testes: permite alocar profissional em plantão sem CRM/COREN validado.
-- Reverter: recriar trigger com plantoes_validar_documentos_profissional() original
-- (ver 20260529150000_documentos_usuarios.sql).

drop trigger if exists plantoes_validar_documentos_profissional_trg on public.plantoes;
