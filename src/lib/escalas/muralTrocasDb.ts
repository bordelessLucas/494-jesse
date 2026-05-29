import { supabase } from '../supabase'

import type { StatusPlantaoEscala } from './escalaTypes'

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

type CandidatoQueryRow = {
  id: string
  candidato_profissional_id: string
  candidato: { nome: string } | null
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
}

export async function substituirProfissionalPlantao(params: {
  plantaoId: string
  novoProfissionalId: string
}): Promise<void> {
  const agora = new Date().toISOString()

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
