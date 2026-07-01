import { addHours, isAfter, isBefore } from 'date-fns'

import { supabase } from '../supabase'
import { inserirNotificacao, buscarAuthUserIdProfissional } from '../notificacoes/notificacoesDb'

import { dataLocalAPartirDeIsoData, formatarHoraDb } from './plantoesDb'
import type { StatusPlantaoEscala } from './escalaTypes'
import {
  registrarEventoAprovacaoMural,
  registrarEventoSubstituicaoCoordenacao,
  buscarContextoPlantaoParaHistorico,
} from './plantoesHistoricoEventosDb'

export type PlantaoMuralRow = {
  id: string
  user_id: string
  local_id: string
  setor_id: string
  profissional_id: string | null
  data_plantao: string
  hora_inicio: string
  hora_fim: string
  status: string
  valor_plantao: number | null
  disponivel_mural: boolean
  locais?: { nome_fantasia: string } | null
  setores?: { nome: string } | null
  profissionais?: { nome: string } | null
}

export type CandidatoTrocaPlantao = {
  id: string
  profissionalId: string
  nome: string
}

export type CandidaturaPendenteRow = {
  id: string
  plantaoId: string
  candidatoProfissionalId: string
  anuncianteProfissionalId: string
  candidatoNome: string
  anuncianteNome: string
  dataPlantao: string
  horaInicio: string
  horaFim: string
  localId: string
  localNome: string
  setorId: string
  setorNome: string
  createdAt: string
}

type CandidatoQueryRow = {
  id: string
  candidato_profissional_id: string
  candidato: { nome: string } | null
}

type CandidaturaPendenteQueryRow = {
  id: string
  plantao_id: string
  candidato_profissional_id: string
  anunciante_profissional_id: string
  created_at: string
  plantoes: {
    id: string
    local_id: string
    setor_id: string
    data_plantao: string
    hora_inicio: string
    hora_fim: string
    locais: { nome_fantasia: string } | null
    setores: { nome: string } | null
  } | null
  anunciante: { nome: string } | null
  candidato: { nome: string } | null
}

function mapCandidaturaPendenteRow(row: CandidaturaPendenteQueryRow): CandidaturaPendenteRow | null {
  if (!row.plantoes) return null
  return {
    id: row.id,
    plantaoId: row.plantao_id,
    candidatoProfissionalId: row.candidato_profissional_id,
    anuncianteProfissionalId: row.anunciante_profissional_id,
    candidatoNome: row.candidato?.nome?.trim() || 'Profissional',
    anuncianteNome: row.anunciante?.nome?.trim() || 'Profissional',
    dataPlantao: row.plantoes.data_plantao,
    horaInicio: row.plantoes.hora_inicio,
    horaFim: row.plantoes.hora_fim,
    localId: row.plantoes.local_id,
    localNome: row.plantoes.locais?.nome_fantasia?.trim() || 'Local',
    setorId: row.plantoes.setor_id,
    setorNome: row.plantoes.setores?.nome?.trim() || 'Setor',
    createdAt: row.created_at,
  }
}

export async function obterTenantUserId(): Promise<string | null> {
  const { data, error } = await supabase.rpc('auth_tenant_user_id')
  if (error) return null
  return typeof data === 'string' ? data : (data as string | null)
}

export async function obterProfissionalIdMembro(): Promise<string | null> {
  const { data, error } = await supabase.rpc('membro_profissional_id')
  if (error) return null
  return typeof data === 'string' ? data : (data as string | null)
}

/** Plantões atualmente anunciados no mural (sem filtrar por data — RLS aplica escopo do tenant). */
export async function buscarPlantoesMural(): Promise<PlantaoMuralRow[]> {
  const { data, error } = await supabase
    .from('plantoes')
    .select(
      `
      id,
      user_id,
      local_id,
      setor_id,
      profissional_id,
      data_plantao,
      hora_inicio,
      hora_fim,
      status,
      valor_plantao,
      disponivel_mural,
      locais ( nome_fantasia ),
      setores ( nome ),
      profissionais ( nome )
    `,
    )
    .eq('disponivel_mural', true)
    .order('data_plantao', { ascending: true })
    .order('hora_inicio', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as PlantaoMuralRow[]
}

export async function anunciarPlantaoNoMural(plantaoId: string): Promise<void> {
  const { error } = await supabase
    .from('plantoes')
    .update({
      status: 'pendente_troca',
      disponivel_mural: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', plantaoId)

  if (error) throw new Error(error.message)
}

export async function cancelarAnuncioPlantaoMural(
  plantaoId: string,
  statusRevertido: StatusPlantaoEscala,
): Promise<void> {
  const agora = new Date().toISOString()

  const { error: erroPlantao } = await supabase
    .from('plantoes')
    .update({
      status: statusRevertido,
      disponivel_mural: false,
      updated_at: agora,
    })
    .eq('id', plantaoId)

  if (erroPlantao) throw new Error(erroPlantao.message)

  const { error: erroSolicitacoes } = await supabase
    .from('plantoes_trocas_solicitacoes')
    .update({ status: 'cancelada', updated_at: agora })
    .eq('plantao_id', plantaoId)
    .eq('status', 'aguardando_aprovacao_coordenador')

  if (erroSolicitacoes) throw new Error(erroSolicitacoes.message)
}

export async function buscarCandidatosPlantao(
  plantaoId: string,
): Promise<CandidatoTrocaPlantao[]> {
  const { data, error } = await supabase
    .from('plantoes_trocas_solicitacoes')
    .select(
      `
      id,
      candidato_profissional_id,
      candidato:profissionais!plantoes_trocas_solicitacoes_candidato_profissional_id_fkey ( nome )
    `,
    )
    .eq('plantao_id', plantaoId)
    .eq('status', 'aguardando_aprovacao_coordenador')
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)

  return ((data ?? []) as CandidatoQueryRow[]).map((row) => ({
    id: row.id,
    profissionalId: row.candidato_profissional_id,
    nome: row.candidato?.nome?.trim() || 'Profissional',
  }))
}

export async function candidatarSePlantao(params: {
  plantaoId: string
  anuncianteProfissionalId: string
}): Promise<void> {
  const [tenantUserId, candidatoProfissionalId] = await Promise.all([
    obterTenantUserId(),
    obterProfissionalIdMembro(),
  ])

  if (!tenantUserId || !candidatoProfissionalId) {
    throw new Error('Não foi possível identificar seu vínculo de profissional.')
  }

  const { error } = await supabase.from('plantoes_trocas_solicitacoes').insert({
    tenant_user_id: tenantUserId,
    plantao_id: params.plantaoId,
    anunciante_profissional_id: params.anuncianteProfissionalId,
    candidato_profissional_id: candidatoProfissionalId,
    status: 'aguardando_aprovacao_coordenador',
    updated_at: new Date().toISOString(),
  })

  if (error) throw new Error(error.message)
}

async function reprovarDemaisSolicitacoesAbertas(
  plantaoId: string,
  solicitacaoAprovadaId: string,
): Promise<void> {
  const { error } = await supabase
    .from('plantoes_trocas_solicitacoes')
    .update({ status: 'reprovada', updated_at: new Date().toISOString() })
    .eq('plantao_id', plantaoId)
    .eq('status', 'aguardando_aprovacao_coordenador')
    .neq('id', solicitacaoAprovadaId)

  if (error) throw new Error(error.message)
}

export async function aprovarTrocaPlantao(params: {
  plantaoId: string
  solicitacaoId: string
  candidatoProfissionalId: string
}): Promise<void> {
  const agora = new Date().toISOString()

  const { data: solicitacao, error: erroSolicitacaoInfo } = await supabase
    .from('plantoes_trocas_solicitacoes')
    .select('anunciante_profissional_id')
    .eq('id', params.solicitacaoId)
    .maybeSingle()

  if (erroSolicitacaoInfo) throw new Error(erroSolicitacaoInfo.message)

  const { error: erroPlantao } = await supabase
    .from('plantoes')
    .update({
      profissional_id: params.candidatoProfissionalId,
      status: 'confirmado',
      disponivel_mural: false,
      updated_at: agora,
    })
    .eq('id', params.plantaoId)

  if (erroPlantao) throw new Error(erroPlantao.message)

  const { error: erroSolicitacao } = await supabase
    .from('plantoes_trocas_solicitacoes')
    .update({ status: 'aprovada', updated_at: agora })
    .eq('id', params.solicitacaoId)

  if (erroSolicitacao) throw new Error(erroSolicitacao.message)

  await reprovarDemaisSolicitacoesAbertas(params.plantaoId, params.solicitacaoId)

  try {
    await registrarEventoAprovacaoMural({
      plantaoId: params.plantaoId,
      solicitacaoId: params.solicitacaoId,
      anuncianteProfissionalId: solicitacao?.anunciante_profissional_id ?? '',
      candidatoProfissionalId: params.candidatoProfissionalId,
      realizadoEm: agora,
    })
  } catch (e) {
    console.error('Falha ao registrar histórico de aprovação no mural:', e)
  }
}

export async function substituirProfissionalPlantao(params: {
  plantaoId: string
  novoProfissionalId: string
}): Promise<void> {
  const agora = new Date().toISOString()

  const contexto = await buscarContextoPlantaoParaHistorico(params.plantaoId)
  const profissionalAnteriorId = contexto?.profissionalFixoId ?? null

  const { error: erroPlantao } = await supabase
    .from('plantoes')
    .update({
      profissional_id: params.novoProfissionalId,
      status: 'confirmado',
      disponivel_mural: false,
      updated_at: agora,
    })
    .eq('id', params.plantaoId)

  if (erroPlantao) throw new Error(erroPlantao.message)

  const { error: erroSolicitacoes } = await supabase
    .from('plantoes_trocas_solicitacoes')
    .update({ status: 'cancelada', updated_at: agora })
    .eq('plantao_id', params.plantaoId)
    .eq('status', 'aguardando_aprovacao_coordenador')

  if (erroSolicitacoes) throw new Error(erroSolicitacoes.message)

  try {
    await registrarEventoSubstituicaoCoordenacao({
      plantaoId: params.plantaoId,
      profissionalAnteriorId,
      novoProfissionalId: params.novoProfissionalId,
      realizadoEm: agora,
    })
  } catch (e) {
    console.error('Falha ao registrar histórico de substituição pela coordenação:', e)
  }
}

export async function reprovarSolicitacaoTroca(solicitacaoId: string): Promise<void> {
  const { error } = await supabase
    .from('plantoes_trocas_solicitacoes')
    .update({
      status: 'reprovada',
      updated_at: new Date().toISOString(),
    })
    .eq('id', solicitacaoId)

  if (error) throw new Error(error.message)
}

/** Solicitações aguardando aprovação da coordenação, com dados do plantão e profissionais. */
export async function buscarCandidaturasPendentes(
  tenantId: string,
  localId?: string,
): Promise<CandidaturaPendenteRow[]> {
  let query = supabase
    .from('plantoes_trocas_solicitacoes')
    .select(
      `
      id,
      plantao_id,
      candidato_profissional_id,
      anunciante_profissional_id,
      created_at,
      plantoes (
        id,
        local_id,
        setor_id,
        data_plantao,
        hora_inicio,
        hora_fim,
        locais ( nome_fantasia ),
        setores ( nome )
      ),
      anunciante:profissionais!plantoes_trocas_solicitacoes_anunciante_profissional_id_fkey ( nome ),
      candidato:profissionais!plantoes_trocas_solicitacoes_candidato_profissional_id_fkey ( nome )
    `,
    )
    .eq('tenant_user_id', tenantId)
    .eq('status', 'aguardando_aprovacao_coordenador')
    .order('created_at', { ascending: false })

  if (localId) {
    query = query.eq('plantoes.local_id', localId)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  return ((data ?? []) as CandidaturaPendenteQueryRow[])
    .map(mapCandidaturaPendenteRow)
    .filter((row): row is CandidaturaPendenteRow => row !== null)
}

export async function aprovarCandidatura(
  solicitacaoId: string,
  plantaoId: string,
  novoProfissionalId: string,
): Promise<void> {
  const { data: plantao, error: erroPlantaoInfo } = await supabase
    .from('plantoes')
    .select('user_id, setores ( nome )')
    .eq('id', plantaoId)
    .maybeSingle()

  if (erroPlantaoInfo) throw new Error(erroPlantaoInfo.message)

  await aprovarTrocaPlantao({
    plantaoId,
    solicitacaoId,
    candidatoProfissionalId: novoProfissionalId,
  })

  const tenantUserId = plantao?.user_id
  const setorNome =
    (plantao?.setores as { nome: string } | null)?.nome?.trim() || 'UTI'
  const authUserId = await buscarAuthUserIdProfissional(novoProfissionalId)

  if (tenantUserId && authUserId) {
    try {
      await inserirNotificacao({
        tenantUserId,
        usuarioId: authUserId,
        titulo: 'Solicitação de plantão aprovada',
        mensagem: `A sua solicitação para assumir o plantão na ${setorNome} foi aprovada!`,
        tipo: 'troca_aprovada',
        linkAcao: '/minha-agenda',
      })
    } catch (e) {
      console.error('Falha ao notificar candidato aprovado:', e)
    }
  }
}

export async function recusarCandidatura(solicitacaoId: string): Promise<void> {
  await reprovarSolicitacaoTroca(solicitacaoId)
}

function dataHoraInicioCandidatura(candidatura: CandidaturaPendenteRow): Date {
  const d = dataLocalAPartirDeIsoData(candidatura.dataPlantao)
  const h = formatarHoraDb(candidatura.horaInicio)
  const [hh, mm] = h.split(':').map(Number)
  d.setHours(hh ?? 0, mm ?? 0, 0, 0)
  return d
}

export function candidaturaNoIntervalo48h(
  candidatura: CandidaturaPendenteRow,
  agora: Date,
): boolean {
  const fim48 = addHours(agora, 48)
  const inicio = dataHoraInicioCandidatura(candidatura)
  return !isBefore(inicio, agora) && !isAfter(inicio, fim48)
}

export function filtrarCandidaturas48h(
  candidaturas: CandidaturaPendenteRow[],
  agora: Date,
): CandidaturaPendenteRow[] {
  return candidaturas.filter((c) => candidaturaNoIntervalo48h(c, agora))
}
