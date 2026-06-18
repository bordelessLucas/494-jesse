-- Locais e setores reais de prestação em Belém/PA.
-- Fonte: documento "LOCAL E SETORES DE SERVIÇO".
-- Idempotente por (user_id, codigo) em locais e (local_id, codigo) em setores.

do $$
declare
  v_owner uuid;
  v_local_id uuid;
begin
  for v_owner in
    select e.owner_user_id
    from public.empresas e
  loop
    -- 1) Hospital E Maternidade Saúde Da Criança
    insert into public.locais (
      user_id,
      codigo,
      nome_fantasia,
      rua,
      numero,
      cidade,
      uf,
      fuso_horario,
      ativo
    )
    values (
      v_owner,
      'LOC-HMSC',
      'Hospital E Maternidade Saúde Da Criança',
      'Travessa Dom Romualdo De Seixas',
      '592',
      'Belém',
      'PA',
      '(UTC-03:00) Brasília',
      true
    )
    on conflict (user_id, codigo) do update
      set
        nome_fantasia = excluded.nome_fantasia,
        rua = excluded.rua,
        numero = excluded.numero,
        cidade = excluded.cidade,
        uf = excluded.uf,
        fuso_horario = excluded.fuso_horario,
        updated_at = now()
    returning id into v_local_id;

    insert into public.setores (user_id, local_id, codigo, nome, ativo)
    values (v_owner, v_local_id, 'UTI-ADULTO', 'UTI-Adulto', true)
    on conflict (local_id, codigo) do update
      set nome = excluded.nome, updated_at = now();

    -- 2) Hospital E Pronto Socorro Dr. Roberto Macedo
    insert into public.locais (
      user_id,
      codigo,
      nome_fantasia,
      rua,
      numero,
      cidade,
      uf,
      fuso_horario,
      ativo
    )
    values (
      v_owner,
      'LOC-HRPS-RM',
      'Hospital E Pronto Socorro Dr. Roberto Macedo',
      'Rodovia Augusto Montenegro',
      '552',
      'Belém',
      'PA',
      '(UTC-03:00) Brasília',
      true
    )
    on conflict (user_id, codigo) do update
      set
        nome_fantasia = excluded.nome_fantasia,
        rua = excluded.rua,
        numero = excluded.numero,
        cidade = excluded.cidade,
        uf = excluded.uf,
        fuso_horario = excluded.fuso_horario,
        updated_at = now()
    returning id into v_local_id;

    insert into public.setores (user_id, local_id, codigo, nome, ativo)
    values
      (v_owner, v_local_id, 'ANESTESIA', 'Anestesia', true),
      (v_owner, v_local_id, 'CIRURGIA-GERAL', 'Cirurgia Geral', true),
      (
        v_owner,
        v_local_id,
        'DIARISTA-PA-ADULTO',
        'Diarista Pronto Atendimento Adulto',
        true
      ),
      (v_owner, v_local_id, 'ENFERMARIA-ADULTO', 'Enfermaria Adulto', true),
      (v_owner, v_local_id, 'ENFERMARIA-PED', 'Enfermaria Pediátrica', true),
      (
        v_owner,
        v_local_id,
        'ENFERMARIA-PED-VISITA',
        'Enfermaria Pediátrica (Visita)',
        true
      ),
      (
        v_owner,
        v_local_id,
        'ENFERMARIA-PED-DIAR-SEM',
        'Enfermaria Pediátrica Diarista Da Semana',
        true
      ),
      (
        v_owner,
        v_local_id,
        'ENFERMARIA-PED-DIAR-FDS',
        'Enfermaria Pediátrica Diarista Final De Semana',
        true
      ),
      (
        v_owner,
        v_local_id,
        'ENFERMARIA-PED-PLANT',
        'Enfermaria Pediátrica Plantonista',
        true
      ),
      (
        v_owner,
        v_local_id,
        'INTERMEDIARIO-PA-ADULTO',
        'Intermediário Pronto Atendimento Adulto',
        true
      ),
      (
        v_owner,
        v_local_id,
        'LIDER-PA-ADULTO',
        'Lider Pronto Atendimento Adulto',
        true
      ),
      (
        v_owner,
        v_local_id,
        'NIR',
        'Núcleo Interno de Regulação (NIR)',
        true
      ),
      (
        v_owner,
        v_local_id,
        'PA-ADULTO',
        'Pronto Atendimento Adulto',
        true
      ),
      (
        v_owner,
        v_local_id,
        'SALA-VERMELHA-ADULTO',
        'Sala Vermelha - Adulto',
        true
      ),
      (v_owner, v_local_id, 'UTI-ADULTO', 'UTI Adulto', true),
      (v_owner, v_local_id, 'UTI-PED', 'UTI Pediátrica', true),
      (
        v_owner,
        v_local_id,
        'UTI-PED-DIARISTA',
        'UTI Pediátrica (Diarista)',
        true
      ),
      (
        v_owner,
        v_local_id,
        'PED-SALA-AMARELA',
        'Pediatria – Sala Amarela',
        true
      ),
      (
        v_owner,
        v_local_id,
        'PED-SALA-VERMELHA',
        'Pediatria – Sala Vermelha',
        true
      ),
      (v_owner, v_local_id, 'PORTA-PED', 'Porta Pediátrica', true)
    on conflict (local_id, codigo) do update
      set nome = excluded.nome, updated_at = now();

    -- 3) Hospital Amazônia
    insert into public.locais (
      user_id,
      codigo,
      nome_fantasia,
      rua,
      numero,
      cidade,
      uf,
      fuso_horario,
      ativo
    )
    values (
      v_owner,
      'LOC-HAMAZONIA',
      'Hospital Amazônia',
      'Travessa Nove De Janeiro',
      '1267',
      'Belém',
      'PA',
      '(UTC-03:00) Brasília',
      true
    )
    on conflict (user_id, codigo) do update
      set
        nome_fantasia = excluded.nome_fantasia,
        rua = excluded.rua,
        numero = excluded.numero,
        cidade = excluded.cidade,
        uf = excluded.uf,
        fuso_horario = excluded.fuso_horario,
        updated_at = now()
    returning id into v_local_id;

    insert into public.setores (user_id, local_id, codigo, nome, ativo)
    values
      (v_owner, v_local_id, 'ENFERMARIA', 'Enfermaria', true),
      (v_owner, v_local_id, 'UTI-AMAZONIA', 'UTI Amazônia', true)
    on conflict (local_id, codigo) do update
      set nome = excluded.nome, updated_at = now();

    -- 4) Hospital Da Mulher Do Pará
    insert into public.locais (
      user_id,
      codigo,
      nome_fantasia,
      rua,
      numero,
      cidade,
      uf,
      fuso_horario,
      ativo
    )
    values (
      v_owner,
      'LOC-HMDP',
      'Hospital Da Mulher Do Pará',
      'Avenida Gentil Bittencourt',
      '2175',
      'Belém',
      'PA',
      '(UTC-03:00) Brasília',
      true
    )
    on conflict (user_id, codigo) do update
      set
        nome_fantasia = excluded.nome_fantasia,
        rua = excluded.rua,
        numero = excluded.numero,
        cidade = excluded.cidade,
        uf = excluded.uf,
        fuso_horario = excluded.fuso_horario,
        updated_at = now()
    returning id into v_local_id;

    insert into public.setores (user_id, local_id, codigo, nome, ativo)
    values
      (
        v_owner,
        v_local_id,
        'AMB-GIN',
        'Ambulatório Ginecologia',
        true
      ),
      (
        v_owner,
        v_local_id,
        'CIR-GIN',
        'Cirurgia Ginecológica',
        true
      ),
      (
        v_owner,
        v_local_id,
        'GIN-PLANTAO',
        'Ginecologia Plantão',
        true
      ),
      (
        v_owner,
        v_local_id,
        'HOSP-ENF-GIN',
        'Hospitalista Da Enfermaria De Ginecologia',
        true
      ),
      (v_owner, v_local_id, 'MASTOLOGIA', 'Mastologia', true),
      (
        v_owner,
        v_local_id,
        'MASTO-AMB',
        'Mastologia Ambulatório',
        true
      ),
      (
        v_owner,
        v_local_id,
        'MASTO-CIR',
        'Mastologia Cirurgia',
        true
      ),
      (
        v_owner,
        v_local_id,
        'NIR',
        'Núcleo Interno de Regulação (NIR)',
        true
      ),
      (
        v_owner,
        v_local_id,
        'GIN-NOTURNO',
        'Plantão Noturno Ginecologia',
        true
      ),
      (
        v_owner,
        v_local_id,
        'PLANT-CLIN-PA',
        'Plantonista Clínico Do Pronto-Atendimento',
        true
      ),
      (
        v_owner,
        v_local_id,
        'PRONTO-ATEND',
        'Pronto Atendimento',
        true
      )
    on conflict (local_id, codigo) do update
      set nome = excluded.nome, updated_at = now();
  end loop;
end $$;
