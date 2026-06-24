-- Confirmação de plantões pelo profissional (aditivo ao fluxo existente).

alter table public.plantoes
  add column if not exists confirmado_profissional boolean not null default false,
  add column if not exists data_confirmacao_profissional timestamptz,
  add column if not exists motivo_recusa text,
  add column if not exists lembrete_confirmacao_enviado boolean not null default false;

comment on column public.plantoes.confirmado_profissional is
  'True quando o profissional aceitou o plantão atribuído.';

comment on column public.plantoes.motivo_recusa is
  'Motivo informado pelo profissional ao recusar (histórico; plantão pode ficar vago).';

create table if not exists public.escala_confirmacoes (
  id uuid primary key default gen_random_uuid(),
  plantao_id uuid not null references public.plantoes (id) on delete cascade,
  profissional_id uuid not null references public.profissionais (id) on delete cascade,
  tenant_user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pendente'
    check (status in ('pendente', 'confirmado', 'recusado')),
  motivo_recusa text,
  confirmado_em timestamptz,
  ip_address text,
  created_at timestamptz not null default now(),
  constraint escala_confirmacoes_plantao_unique unique (plantao_id)
);

create index escala_confirmacoes_tenant_idx
  on public.escala_confirmacoes (tenant_user_id);

create index escala_confirmacoes_profissional_idx
  on public.escala_confirmacoes (profissional_id);

alter table public.escala_confirmacoes enable row level security;

-- Profissional: apenas os seus registos.
create policy "escala_confirmacoes_select_membro"
  on public.escala_confirmacoes
  for select
  to authenticated
  using (
    tenant_user_id = public.auth_tenant_user_id()
    and profissional_id = public.membro_profissional_id()
  );

create policy "escala_confirmacoes_insert_membro"
  on public.escala_confirmacoes
  for insert
  to authenticated
  with check (
    tenant_user_id = public.auth_tenant_user_id()
    and profissional_id = public.membro_profissional_id()
  );

create policy "escala_confirmacoes_update_membro"
  on public.escala_confirmacoes
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

-- Titular: todos do tenant.
create policy "escala_confirmacoes_select_titular"
  on public.escala_confirmacoes
  for select
  to authenticated
  using (
    tenant_user_id = public.auth_tenant_user_id()
    and public.auth_is_titular_conta()
  );

create policy "escala_confirmacoes_insert_titular"
  on public.escala_confirmacoes
  for insert
  to authenticated
  with check (
    tenant_user_id = public.auth_tenant_user_id()
    and public.auth_is_titular_conta()
  );

create policy "escala_confirmacoes_update_titular"
  on public.escala_confirmacoes
  for update
  to authenticated
  using (
    tenant_user_id = public.auth_tenant_user_id()
    and public.auth_is_titular_conta()
  )
  with check (
    tenant_user_id = public.auth_tenant_user_id()
    and public.auth_is_titular_conta()
  );

-- Ao trocar o profissional atribuído, repõe confirmação pendente.
create or replace function public.reset_confirmacao_plantao()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.profissional_id is not null then
      new.confirmado_profissional := false;
      new.data_confirmacao_profissional := null;
      new.motivo_recusa := null;
      new.lembrete_confirmacao_enviado := false;
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if new.profissional_id is distinct from old.profissional_id then
      new.confirmado_profissional := false;
      new.data_confirmacao_profissional := null;
      new.motivo_recusa := null;
      new.lembrete_confirmacao_enviado := false;

      if new.profissional_id is null then
        delete from public.escala_confirmacoes where plantao_id = new.id;
      end if;
    end if;
    return new;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_reset_confirmacao_plantao on public.plantoes;

create trigger trg_reset_confirmacao_plantao
  before insert or update of profissional_id on public.plantoes
  for each row
  execute function public.reset_confirmacao_plantao();

-- Cria registo pendente após atribuir profissional.
create or replace function public.sync_escala_confirmacao_plantao()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.profissional_id is not null then
    insert into public.escala_confirmacoes (
      plantao_id,
      profissional_id,
      tenant_user_id,
      status
    )
    values (
      new.id,
      new.profissional_id,
      new.user_id,
      'pendente'
    )
    on conflict (plantao_id) do update set
      profissional_id = excluded.profissional_id,
      status = 'pendente',
      motivo_recusa = null,
      confirmado_em = null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_escala_confirmacao on public.plantoes;

create trigger trg_sync_escala_confirmacao
  after insert or update of profissional_id on public.plantoes
  for each row
  when (new.profissional_id is not null)
  execute function public.sync_escala_confirmacao_plantao();

-- RPC: profissional confirma ou recusa plantão.
create or replace function public.confirmar_plantao(
  p_plantao_id uuid,
  p_aceitar boolean,
  p_motivo text default null,
  p_ip_address text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant uuid;
  v_prof uuid;
  v_plantao record;
  v_agora timestamptz := now();
  v_titulo text;
  v_mensagem text;
begin
  v_tenant := public.auth_tenant_user_id();
  v_prof := public.membro_profissional_id();

  if v_prof is null then
    return jsonb_build_object('success', false, 'message', 'Apenas profissionais podem confirmar plantões.');
  end if;

  select
    p.id,
    p.user_id,
    p.profissional_id,
    p.data_plantao,
    p.hora_inicio,
    p.hora_fim,
    p.status,
    p.confirmado_profissional,
    l.nome_fantasia as local_nome,
    s.nome as setor_nome,
    pr.nome as prof_nome
  into v_plantao
  from public.plantoes p
  join public.locais l on l.id = p.local_id
  join public.setores s on s.id = p.setor_id
  join public.profissionais pr on pr.id = p.profissional_id
  where p.id = p_plantao_id
    and p.user_id = v_tenant
    and p.profissional_id = v_prof
  for update;

  if not found then
    return jsonb_build_object('success', false, 'message', 'Plantão não encontrado ou não pertence a si.');
  end if;

  if v_plantao.confirmado_profissional then
    return jsonb_build_object('success', false, 'message', 'Este plantão já foi confirmado.');
  end if;

  if not p_aceitar then
    if p_motivo is null or length(trim(p_motivo)) < 10 then
      return jsonb_build_object(
        'success', false,
        'message', 'Informe o motivo da recusa (mínimo 10 caracteres).'
      );
    end if;

    update public.plantoes
    set
      status = 'vago',
      profissional_id = null,
      confirmado_profissional = false,
      data_confirmacao_profissional = null,
      motivo_recusa = trim(p_motivo),
      updated_at = v_agora
    where id = p_plantao_id;

    insert into public.escala_confirmacoes (
      plantao_id,
      profissional_id,
      tenant_user_id,
      status,
      motivo_recusa,
      confirmado_em,
      ip_address
    )
    values (
      p_plantao_id,
      v_prof,
      v_tenant,
      'recusado',
      trim(p_motivo),
      v_agora,
      p_ip_address
    )
    on conflict (plantao_id) do update set
      profissional_id = excluded.profissional_id,
      status = 'recusado',
      motivo_recusa = excluded.motivo_recusa,
      confirmado_em = excluded.confirmado_em,
      ip_address = excluded.ip_address;

    v_titulo := 'Plantão recusado';
    v_mensagem := format(
      '%s recusou o plantão de %s (%s · %s). Motivo: %s',
      v_plantao.prof_nome,
      to_char(v_plantao.data_plantao, 'DD/MM/YYYY'),
      v_plantao.local_nome,
      v_plantao.setor_nome,
      trim(p_motivo)
    );
  else
    update public.plantoes
    set
      confirmado_profissional = true,
      data_confirmacao_profissional = v_agora,
      motivo_recusa = null,
      updated_at = v_agora
    where id = p_plantao_id;

    insert into public.escala_confirmacoes (
      plantao_id,
      profissional_id,
      tenant_user_id,
      status,
      confirmado_em,
      ip_address
    )
    values (
      p_plantao_id,
      v_prof,
      v_tenant,
      'confirmado',
      v_agora,
      p_ip_address
    )
    on conflict (plantao_id) do update set
      profissional_id = excluded.profissional_id,
      status = 'confirmado',
      motivo_recusa = null,
      confirmado_em = excluded.confirmado_em,
      ip_address = excluded.ip_address;

    v_titulo := 'Plantão confirmado';
    v_mensagem := format(
      '%s confirmou o plantão de %s (%s · %s).',
      v_plantao.prof_nome,
      to_char(v_plantao.data_plantao, 'DD/MM/YYYY'),
      v_plantao.local_nome,
      v_plantao.setor_nome
    );
  end if;

  insert into public.notificacoes (
    tenant_user_id,
    usuario_id,
    titulo,
    mensagem,
    tipo,
    link_acao
  )
  values (
    v_tenant,
    v_tenant,
    v_titulo,
    v_mensagem,
    case when p_aceitar then 'confirmacao_escala' else 'recusa_escala' end,
    '/painel/confirmacoes'
  );

  return jsonb_build_object(
    'success', true,
    'message',
    case when p_aceitar then 'Plantão confirmado com sucesso.' else 'Plantão recusado. O gestor foi notificado.' end
  );
end;
$$;

grant execute on function public.confirmar_plantao(uuid, boolean, text, text) to authenticated;
