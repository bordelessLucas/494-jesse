import { supabase } from '../supabase'

export type TipoEventoPlantaoHistorico =
  | 'passagem'
  | 'troca'
  | 'substituicao_coordenacao'
  | 'cobertura'
  | 'falta_justificada'
  | 'falta_nao_justificada'

export type OrigemEventoPlantaoHistorico = 'mural' | 'coordenacao' | 'sistema'

export type ContextoPlantaoHistorico = {
  plantaoId: string
  tenantUserId: string
  profissionalFixoId: string | null
  observacoes: string | null
}

export type RegistrarEventoPlantaoHistoricoInput = {
  tenantUserId: string
  plantaoId: string
  tipoEvento: TipoEventoPlantaoHistorico
  situacaoRotulo?: string
  profissionalFixoId: string | null
  profissionalResponsavelId: string | null
  solicitacaoId?: string | null
  justificativa?: string | null
  observacaoInterna?: string | null
  origem: OrigemEventoPlantaoHistorico
  realizadoEm?: string
}

const JANELA_EMPARELHAMENTO_MS = 90 * 24 * 60 * 60 * 1000

export async function buscarContextoPlantaoParaHistorico(
  plantaoId: string,
): Promise<ContextoPlantaoHistorico | null> {
  const { data, error } = await supabase
    .from('plantoes')
    .select('id, user_id, profissional_id, observacoes')
    .eq('id', plantaoId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null

  return {
    plantaoId: data.id,
    tenantUserId: data.user_id,
    profissionalFixoId: data.profissional_id,
    observacoes: data.observacoes,
  }
}

async function tentarEmparelharTrocaHistorico(params: {
  tenantUserId: string
  eventoId: string
  plantaoId: string
  profissionalFixoId: string
  profissionalResponsavelId: string
  realizadoEm: string
}): Promise<void> {
  const limiteInferior = new Date(
    new Date(params.realizadoEm).getTime() - JANELA_EMPARELHAMENTO_MS,
  ).toISOString()

  const { data: candidatos, error } = await supabase
    .from('plantoes_historico_eventos')
    .select('id, plantao_id')
    .eq('tenant_user_id', params.tenantUserId)
    .eq('tipo_evento', 'passagem')
    .eq('profissional_fixo_id', params.profissionalResponsavelId)
    .eq('profissional_responsavel_id', params.profissionalFixoId)
    .is('evento_par_id', null)
    .gte('realizado_em', limiteInferior)
    .neq('id', params.eventoId)
    .order('realizado_em', { ascending: false })
    .limit(1)

  if (error) throw new Error(error.message)

  const par = candidatos?.[0]
  if (!par) return

  const { error: erroNovo } = await supabase
    .from('plantoes_historico_eventos')
    .update({
      tipo_evento: 'troca',
      plantao_destino_id: par.plantao_id,
      evento_par_id: par.id,
    })
    .eq('id', params.eventoId)

  if (erroNovo) throw new Error(erroNovo.message)

  const { error: erroPar } = await supabase
    .from('plantoes_historico_eventos')
    .update({
      tipo_evento: 'troca',
      plantao_destino_id: params.plantaoId,
      evento_par_id: params.eventoId,
    })
    .eq('id', par.id)

  if (erroPar) throw new Error(erroPar.message)
}

export async function registrarEventoPlantaoHistorico(
  input: RegistrarEventoPlantaoHistoricoInput,
): Promise<string | null> {
  const realizadoEm = input.realizadoEm ?? new Date().toISOString()

  const { data: authData } = await supabase.auth.getUser()
  const registradoPorAuthId = authData.user?.id ?? null

  const { data, error } = await supabase
    .from('plantoes_historico_eventos')
    .insert({
      tenant_user_id: input.tenantUserId,
      plantao_id: input.plantaoId,
      solicitacao_id: input.solicitacaoId ?? null,
      tipo_evento: input.tipoEvento,
      situacao_rotulo: input.situacaoRotulo ?? 'Trocado',
      profissional_fixo_id: input.profissionalFixoId,
      profissional_responsavel_id: input.profissionalResponsavelId,
      justificativa: input.justificativa ?? null,
      observacao_interna: input.observacaoInterna ?? null,
      origem: input.origem,
      realizado_em: realizadoEm,
      registrado_por_auth_id: registradoPorAuthId,
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  const eventoId = data?.id ?? null
  if (
    eventoId &&
    input.tipoEvento === 'passagem' &&
    input.profissionalFixoId &&
    input.profissionalResponsavelId
  ) {
    await tentarEmparelharTrocaHistorico({
      tenantUserId: input.tenantUserId,
      eventoId,
      plantaoId: input.plantaoId,
      profissionalFixoId: input.profissionalFixoId,
      profissionalResponsavelId: input.profissionalResponsavelId,
      realizadoEm,
    })
  }

  return eventoId
}

export async function registrarEventoAprovacaoMural(params: {
  plantaoId: string
  solicitacaoId: string
  anuncianteProfissionalId: string
  candidatoProfissionalId: string
  realizadoEm: string
}): Promise<void> {
  const contexto = await buscarContextoPlantaoParaHistorico(params.plantaoId)
  if (!contexto) return

  const fixoId = params.anuncianteProfissionalId || contexto.profissionalFixoId

  await registrarEventoPlantaoHistorico({
    tenantUserId: contexto.tenantUserId,
    plantaoId: params.plantaoId,
    solicitacaoId: params.solicitacaoId,
    tipoEvento: 'passagem',
    situacaoRotulo: 'Trocado',
    profissionalFixoId: fixoId,
    profissionalResponsavelId: params.candidatoProfissionalId,
    justificativa: contexto.observacoes,
    observacaoInterna: contexto.observacoes,
    origem: 'mural',
    realizadoEm: params.realizadoEm,
  })
}

export async function registrarEventoSubstituicaoCoordenacao(params: {
  plantaoId: string
  profissionalAnteriorId: string | null
  novoProfissionalId: string
  realizadoEm: string
}): Promise<void> {
  const contexto = await buscarContextoPlantaoParaHistorico(params.plantaoId)
  if (!contexto) return

  await registrarEventoPlantaoHistorico({
    tenantUserId: contexto.tenantUserId,
    plantaoId: params.plantaoId,
    tipoEvento: 'substituicao_coordenacao',
    situacaoRotulo: 'Trocado',
    profissionalFixoId: params.profissionalAnteriorId,
    profissionalResponsavelId: params.novoProfissionalId,
    justificativa: contexto.observacoes,
    observacaoInterna: contexto.observacoes,
    origem: 'coordenacao',
    realizadoEm: params.realizadoEm,
  })
}
