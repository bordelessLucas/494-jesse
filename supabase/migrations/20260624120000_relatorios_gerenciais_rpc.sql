-- RPCs para relatórios gerenciais (/painel/relatorios).
-- Todas filtram por tenant via auth_tenant_user_id().

-- Duração em horas de um plantão (cruza meia-noite se fim <= início).
create or replace function public.plantao_duracao_horas(
  p_data date,
  p_hora_inicio text,
  p_hora_fim text
)
returns numeric
language plpgsql
immutable
as $$
declare
  v_inicio timestamptz;
  v_fim timestamptz;
  v_hi time;
  v_hf time;
begin
  begin
    v_hi := left(trim(p_hora_inicio), 5)::time;
    v_hf := left(trim(p_hora_fim), 5)::time;
  exception
    when others then
      return 0;
  end;

  v_inicio := p_data + v_hi;
  v_fim := p_data + v_hf;

  if v_fim <= v_inicio then
    v_fim := v_fim + interval '1 day';
  end if;

  return round(extract(epoch from (v_fim - v_inicio)) / 3600.0, 2);
end;
$$;

comment on function public.plantao_duracao_horas(date, text, text) is
  'Calcula duração do plantão em horas (suporta turnos noturnos).';

-- Série temporal mensal de plantões.
create or replace function public.plantoes_por_mes(
  p_local_id uuid default null,
  p_meses int default 12
)
returns table (
  mes text,
  total bigint,
  realizados bigint,
  vagos bigint,
  custo numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_tenant uuid;
  v_meses int;
  v_inicio date;
begin
  v_tenant := public.auth_tenant_user_id();
  if v_tenant is null then
    return;
  end if;

  v_meses := greatest(coalesce(p_meses, 12), 1);
  v_inicio := date_trunc('month', current_date)::date - ((v_meses - 1) || ' months')::interval;

  return query
  with meses as (
    select to_char(d, 'YYYY-MM') as mes_chave
    from generate_series(
      v_inicio,
      date_trunc('month', current_date)::date,
      interval '1 month'
    ) as d
  ),
  agregado as (
    select
      to_char(p.data_plantao, 'YYYY-MM') as mes_chave,
      count(*)::bigint as total,
      count(*) filter (where p.status = 'realizado')::bigint as realizados,
      count(*) filter (where p.status = 'vago')::bigint as vagos,
      coalesce(
        sum(
          case
            when p.status = 'realizado'
              then p.valor_plantao + coalesce(p.ajuste_financeiro, 0)
            else 0
          end
        ),
        0
      ) as custo
    from public.plantoes p
    where p.user_id = v_tenant
      and p.data_plantao >= v_inicio
      and (p.local_id = p_local_id or p_local_id is null)
    group by 1
  )
  select
    m.mes_chave as mes,
    coalesce(a.total, 0)::bigint as total,
    coalesce(a.realizados, 0)::bigint as realizados,
    coalesce(a.vagos, 0)::bigint as vagos,
    coalesce(a.custo, 0)::numeric as custo
  from meses m
  left join agregado a on a.mes_chave = m.mes_chave
  order by m.mes_chave;
end;
$$;

-- Ranking de profissionais por competência (YYYY-MM).
create or replace function public.profissionais_ranking(
  p_competencia text,
  p_local_id uuid default null
)
returns table (
  profissional_id uuid,
  nome text,
  horas numeric,
  plantoes bigint,
  valor_total numeric,
  taxa_presenca numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_tenant uuid;
  v_inicio date;
  v_fim date;
begin
  v_tenant := public.auth_tenant_user_id();
  if v_tenant is null or p_competencia is null or p_competencia !~ '^\d{4}-\d{2}$' then
    return;
  end if;

  v_inicio := (p_competencia || '-01')::date;
  v_fim := (date_trunc('month', v_inicio) + interval '1 month' - interval '1 day')::date;

  return query
  with base as (
    select
      p.id as plantao_id,
      p.profissional_id,
      pr.nome as prof_nome,
      public.plantao_duracao_horas(p.data_plantao, p.hora_inicio, p.hora_fim) as duracao,
      p.valor_plantao + coalesce(p.ajuste_financeiro, 0) as valor_linha,
      p.status
    from public.plantoes p
    join public.profissionais pr on pr.id = p.profissional_id
    where p.user_id = v_tenant
      and p.data_plantao between v_inicio and v_fim
      and p.profissional_id is not null
      and p.status in ('confirmado', 'pendente', 'realizado', 'pendente_troca')
      and (p.local_id = p_local_id or p_local_id is null)
  ),
  presenca as (
    select distinct rp.plantao_id
    from public.registro_ponto rp
    where rp.user_id = v_tenant
      and rp.entrada_em is not null
  )
  select
    b.profissional_id,
    max(b.prof_nome) as nome,
    round(sum(b.duracao), 2) as horas,
    count(*)::bigint as plantoes,
    round(sum(b.valor_linha), 2) as valor_total,
    case
      when count(*) filter (where b.status in ('realizado', 'confirmado')) = 0 then 0
      else round(
        (
          count(*) filter (
            where b.status in ('realizado', 'confirmado')
              and exists (select 1 from presenca prs where prs.plantao_id = b.plantao_id)
          )::numeric
          / nullif(
            count(*) filter (where b.status in ('realizado', 'confirmado'))::numeric,
            0
          )
        ) * 100,
        2
      )
    end as taxa_presenca
  from base b
  group by b.profissional_id
  order by valor_total desc, horas desc;
end;
$$;

-- Resumo por setor na competência.
create or replace function public.resumo_setor(p_competencia text)
returns table (
  setor_id uuid,
  setor_nome text,
  local_nome text,
  total_plantoes bigint,
  cobertos bigint,
  vagos bigint,
  custo numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_tenant uuid;
  v_inicio date;
  v_fim date;
begin
  v_tenant := public.auth_tenant_user_id();
  if v_tenant is null or p_competencia is null or p_competencia !~ '^\d{4}-\d{2}$' then
    return;
  end if;

  v_inicio := (p_competencia || '-01')::date;
  v_fim := (date_trunc('month', v_inicio) + interval '1 month' - interval '1 day')::date;

  return query
  select
    s.id as setor_id,
    s.nome as setor_nome,
    l.nome_fantasia as local_nome,
    count(p.id)::bigint as total_plantoes,
    count(p.id) filter (
      where p.status <> 'vago' and p.profissional_id is not null
    )::bigint as cobertos,
    count(p.id) filter (where p.status = 'vago')::bigint as vagos,
    coalesce(
      sum(
        case
          when p.status = 'realizado'
            then p.valor_plantao + coalesce(p.ajuste_financeiro, 0)
          else 0
        end
      ),
      0
    )::numeric as custo
  from public.plantoes p
  join public.setores s on s.id = p.setor_id
  join public.locais l on l.id = p.local_id
  where p.user_id = v_tenant
    and p.data_plantao between v_inicio and v_fim
  group by s.id, s.nome, l.nome_fantasia
  order by l.nome_fantasia, s.nome;
end;
$$;

-- Profissionais com carga elevada na semana.
create or replace function public.profissionais_sobrecarga(p_semana_inicio date)
returns table (
  profissional_id uuid,
  nome text,
  horas_semana numeric,
  plantoes_semana bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_tenant uuid;
  v_fim date;
begin
  v_tenant := public.auth_tenant_user_id();
  if v_tenant is null or p_semana_inicio is null then
    return;
  end if;

  v_fim := p_semana_inicio + interval '6 days';

  return query
  select
    pr.id as profissional_id,
    pr.nome,
    round(
      sum(public.plantao_duracao_horas(p.data_plantao, p.hora_inicio, p.hora_fim)),
      2
    ) as horas_semana,
    count(p.id)::bigint as plantoes_semana
  from public.plantoes p
  join public.profissionais pr on pr.id = p.profissional_id
  where p.user_id = v_tenant
    and p.data_plantao between p_semana_inicio and v_fim::date
    and p.profissional_id is not null
    and p.status in ('confirmado', 'pendente', 'realizado', 'pendente_troca')
  group by pr.id, pr.nome
  having sum(public.plantao_duracao_horas(p.data_plantao, p.hora_inicio, p.hora_fim)) > 60
  order by horas_semana desc;
end;
$$;

grant execute on function public.plantao_duracao_horas(date, text, text) to authenticated;
grant execute on function public.plantoes_por_mes(uuid, int) to authenticated;
grant execute on function public.profissionais_ranking(text, uuid) to authenticated;
grant execute on function public.resumo_setor(text) to authenticated;
grant execute on function public.profissionais_sobrecarga(date) to authenticated;
