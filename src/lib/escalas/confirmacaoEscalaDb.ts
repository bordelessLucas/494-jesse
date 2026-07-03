import { supabase } from '../supabase'
import { EMBED_ESCALA_CONFIRMACOES_MASTER } from './plantoesDb'
import type { StatusConfirmacaoEscala } from './confirmacaoEscalaTypes'

export type PlantaoConfirmacaoPendente = {
  id: string
  data_plantao: string
  hora_inicio: string
  hora_fim: string
  status: string
  valor_plantao: number
  local_nome: string
  setor_nome: string
}

export type PlantaoConfirmacaoMasterRow = {
  id: string
  data_plantao: string
  hora_inicio: string
  hora_fim: string
  status: string
  valor_plantao: number
  confirmado_profissional: boolean
  data_confirmacao_profissional: string | null
  motivo_recusa: string | null
  profissional_id: string | null
  profissional_nome: string | null
  local_id: string
  local_nome: string
  setor_id: string
  setor_nome: string
  confirmacao_status: StatusConfirmacaoEscala | null
  confirmacao_motivo: string | null
  confirmacao_em: string | null
  confirmacao_profissional_id: string | null
}

export type ConfirmarPlantaoResult = {
  success: boolean
  message: string
}

const SELECT_PLANTAO_CONFIRMACAO = `
  id,
  data_plantao,
  hora_inicio,
  hora_fim,
  status,
  valor_plantao,
  locais ( nome_fantasia ),
  setores ( nome )
`

function mapPlantaoPendente(row: Record<string, unknown>): PlantaoConfirmacaoPendente {
  const locais = row.locais as { nome_fantasia: string } | null
  const setores = row.setores as { nome: string } | null
  return {
    id: String(row.id),
    data_plantao: String(row.data_plantao),
    hora_inicio: String(row.hora_inicio),
    hora_fim: String(row.hora_fim),
    status: String(row.status),
    valor_plantao: Number(row.valor_plantao ?? 0),
    local_nome: locais?.nome_fantasia ?? '—',
    setor_nome: setores?.nome ?? '—',
  }
}

/** Plantões futuros aguardando confirmação do profissional logado. */
export async function buscarPlantoesParaConfirmar(
  profissionalId: string,
  tenantUserId: string,
): Promise<PlantaoConfirmacaoPendente[]> {
  const hoje = new Date().toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('plantoes')
    .select(SELECT_PLANTAO_CONFIRMACAO)
    .eq('user_id', tenantUserId)
    .eq('profissional_id', profissionalId)
    .eq('confirmado_profissional', false)
    .in('status', ['confirmado', 'pendente'])
    .gte('data_plantao', hoje)
    .order('data_plantao', { ascending: true })
    .order('hora_inicio', { ascending: true })
    .limit(10)

  if (error) throw new Error(error.message)
  return (data ?? []).map((r) => mapPlantaoPendente(r as Record<string, unknown>))
}

export async function rpcConfirmarPlantao(
  plantaoId: string,
  aceitar: boolean,
  motivo?: string,
): Promise<ConfirmarPlantaoResult> {
  const { data, error } = await supabase.rpc('confirmar_plantao', {
    p_plantao_id: plantaoId,
    p_aceitar: aceitar,
    p_motivo: motivo?.trim() || null,
    p_ip_address: null,
  })

  if (error) throw new Error(error.message)

  const payload = data as ConfirmarPlantaoResult | null
  if (!payload) {
    return { success: false, message: 'Resposta inválida do servidor.' }
  }
  return payload
}

/** Plantões futuros com estado de confirmação (visão MASTER). */
export async function buscarPlantoesConfirmacaoMaster(params: {
  tenantUserId: string
  dataInicio: string
  dataFim: string
  localId?: string
  filtroStatus?: 'todos' | 'confirmados' | 'pendentes' | 'recusados'
}): Promise<PlantaoConfirmacaoMasterRow[]> {
  let query = supabase
    .from('plantoes')
    .select(
      `
      id,
      data_plantao,
      hora_inicio,
      hora_fim,
      status,
      valor_plantao,
      confirmado_profissional,
      data_confirmacao_profissional,
      motivo_recusa,
      profissional_id,
      local_id,
      setor_id,
      profissionais ( nome ),
      locais ( nome_fantasia ),
      setores ( nome ),
      ${EMBED_ESCALA_CONFIRMACOES_MASTER}
    `,
    )
    .eq('user_id', params.tenantUserId)
    .gte('data_plantao', params.dataInicio)
    .lte('data_plantao', params.dataFim)
    .order('data_plantao', { ascending: true })
    .order('hora_inicio', { ascending: true })

  if (params.localId) {
    query = query.eq('local_id', params.localId)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  const rows = (data ?? []).map((raw) => {
    const row = raw as Record<string, unknown>
    const confArr = row.escala_confirmacoes as
      | {
          status: StatusConfirmacaoEscala
          motivo_recusa: string | null
          confirmado_em: string | null
          profissional_id: string
        }[]
      | {
          status: StatusConfirmacaoEscala
          motivo_recusa: string | null
          confirmado_em: string | null
          profissional_id: string
        }
      | null

    const conf = Array.isArray(confArr) ? confArr[0] : confArr
    const confirmadoProfissional = Boolean(row.confirmado_profissional)
    const motivoPlantao = (row.motivo_recusa as string | null) ?? null
    const profissionalId = (row.profissional_id as string | null) ?? null
    const dataConfirmacao =
      (row.data_confirmacao_profissional as string | null) ?? null

    const prof = row.profissionais as { nome: string } | null
    const loc = row.locais as { nome_fantasia: string } | null
    const set = row.setores as { nome: string } | null

    return {
      id: String(row.id),
      data_plantao: String(row.data_plantao),
      hora_inicio: String(row.hora_inicio),
      hora_fim: String(row.hora_fim),
      status: String(row.status),
      valor_plantao: Number(row.valor_plantao ?? 0),
      confirmado_profissional: confirmadoProfissional,
      data_confirmacao_profissional: dataConfirmacao,
      motivo_recusa: motivoPlantao,
      profissional_id: profissionalId,
      profissional_nome: prof?.nome ?? null,
      local_id: String(row.local_id),
      local_nome: loc?.nome_fantasia ?? '—',
      setor_id: String(row.setor_id),
      setor_nome: set?.nome ?? '—',
      confirmacao_status:
        conf?.status ??
        (confirmadoProfissional
          ? 'confirmado'
          : motivoPlantao?.trim()
            ? 'recusado'
            : profissionalId
              ? 'pendente'
              : null),
      confirmacao_motivo: conf?.motivo_recusa ?? motivoPlantao,
      confirmacao_em: conf?.confirmado_em ?? dataConfirmacao,
      confirmacao_profissional_id: conf?.profissional_id ?? profissionalId,
    } satisfies PlantaoConfirmacaoMasterRow
  })

  if (!params.filtroStatus || params.filtroStatus === 'todos') {
    return rows.filter((r) => r.profissional_id != null || r.confirmacao_status === 'recusado')
  }

  return rows.filter((r) => {
    switch (params.filtroStatus) {
      case 'confirmados':
        return r.confirmado_profissional || r.confirmacao_status === 'confirmado'
      case 'pendentes':
        return (
          r.profissional_id != null &&
          !r.confirmado_profissional &&
          r.confirmacao_status !== 'recusado' &&
          ['confirmado', 'pendente'].includes(r.status)
        )
      case 'recusados':
        return r.confirmacao_status === 'recusado'
      default:
        return true
    }
  })
}

export async function cobrarConfirmacaoPlantao(params: {
  tenantUserId: string
  plantaoId: string
  profissionalId: string
  dataPlantao: string
  localNome: string
  setorNome: string
}): Promise<void> {
  const authUserId = await import('../notificacoes/notificacoesDb').then((m) =>
    m.buscarAuthUserIdProfissional(params.profissionalId),
  )
  if (!authUserId) {
    throw new Error('Profissional sem acesso ao sistema.')
  }

  const { inserirNotificacao } = await import('../notificacoes/notificacoesDb')

  await inserirNotificacao({
    tenantUserId: params.tenantUserId,
    usuarioId: authUserId,
    titulo: 'Confirme seu plantão',
    mensagem: `Aguardamos sua confirmação para o plantão de ${params.dataPlantao} em ${params.localNome} · ${params.setorNome}.`,
    tipo: 'lembrete_confirmacao',
    linkAcao: '/minha-agenda',
  })

  await supabase
    .from('plantoes')
    .update({ lembrete_confirmacao_enviado: true })
    .eq('id', params.plantaoId)
    .eq('user_id', params.tenantUserId)
}
