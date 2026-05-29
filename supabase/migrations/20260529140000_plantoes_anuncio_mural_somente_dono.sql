-- Apenas o profissional escalado (membro vinculado) pode anunciar ou cancelar anúncio no mural.
-- Coordenação/titular continua podendo retirar do mural via aprovação de troca ou repasse direto.

create or replace function public.plantoes_validar_anuncio_mural()
returns trigger
language plpgsql
as $$
begin
  if coalesce(old.disponivel_mural, false) = coalesce(new.disponivel_mural, false) then
    return new;
  end if;

  if new.disponivel_mural = true then
    if new.profissional_id is null then
      raise exception 'Plantão sem profissional não pode ser anunciado no mural.';
    end if;

    if public.membro_profissional_id() is null
      or public.membro_profissional_id() is distinct from new.profissional_id then
      raise exception 'Apenas o profissional escalado pode anunciar no mural de trocas.';
    end if;

    return new;
  end if;

  -- Remover do mural: titular (aprovação/repasse) ou o próprio profissional escalado.
  if public.auth_is_titular_conta() then
    return new;
  end if;

  if public.membro_profissional_id() is null
    or public.membro_profissional_id() is distinct from old.profissional_id then
    raise exception 'Apenas o profissional escalado pode cancelar o anúncio no mural.';
  end if;

  return new;
end;
$$;

drop trigger if exists plantoes_validar_anuncio_mural_trg on public.plantoes;

create trigger plantoes_validar_anuncio_mural_trg
  before update on public.plantoes
  for each row
  execute function public.plantoes_validar_anuncio_mural();
