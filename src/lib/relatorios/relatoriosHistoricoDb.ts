import { supabase } from '../supabase'
import type { Database, Json } from '../../types/database.types'

export type TipoRelatorioHistorico =
  | 'FrequenciaSetor'
  | 'FrequenciaCoordenacao'
  | 'RelatorioSCIRAS'

export type StatusWorkflowRelatorio =
  | 'rascunho'
  | 'em_auditoria'
  | 'aprovado'
  | 'faturado'

export type RelatorioHistoricoRow = {
  id: string
  user_id: string
  tipo_relatorio: TipoRelatorioHistorico
  titulo: string
  competencia: string
  local_ref: string
  local_nome: string
  cabecalho: Json
  snapshot: Json
  impresso_em: string
  created_at: string
  pdf_assinado_url: string | null
  profissional_emissor_id: string | null
  assinado_em: string | null
  status_workflow: StatusWorkflowRelatorio
  anexos_urls: string[]
  auditor_id: string | null
  faturista_id: string | null
}

export type RegistrarRelatorioImpressoInput = {
  tipo_relatorio: TipoRelatorioHistorico
  titulo: string
  competencia: string
  local_ref: string
  local_nome: string
  cabecalho: Json
  snapshot: Json
  status_workflow?: StatusWorkflowRelatorio
  anexos_urls?: string[]
}

export type AtualizarStatusWorkflowInput = {
  status_workflow: StatusWorkflowRelatorio
  auditor_id?: string | null
  faturista_id?: string | null
  anexos_urls?: string[]
  snapshot?: Json
}

function mesclarSnapshotComObservacao(
  snapshot: Json,
  observacao: string,
  auditorId: string,
): Json {
  const base =
    snapshot && typeof snapshot === 'object' && !Array.isArray(snapshot)
      ? { ...(snapshot as Record<string, unknown>) }
      : {}

  const workflowAnterior =
    base.workflow && typeof base.workflow === 'object' && !Array.isArray(base.workflow)
      ? (base.workflow as Record<string, unknown>)
      : {}

  return {
    ...base,
    workflow: {
      ...workflowAnterior,
      ultima_devolucao: {
        observacao,
        auditor_id: auditorId,
        em: new Date().toISOString(),
      },
    },
  } as Json
}

export function extrairUltimaDevolucao(snapshot: Json): {
  observacao: string
  em: string
} | null {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) return null
  const workflow = (snapshot as Record<string, unknown>).workflow
  if (!workflow || typeof workflow !== 'object' || Array.isArray(workflow)) return null
  const ultima = (workflow as Record<string, unknown>).ultima_devolucao
  if (!ultima || typeof ultima !== 'object' || Array.isArray(ultima)) return null
  const observacao = (ultima as Record<string, unknown>).observacao
  const em = (ultima as Record<string, unknown>).em
  if (typeof observacao !== 'string' || !observacao.trim()) return null
  return {
    observacao: observacao.trim(),
    em: typeof em === 'string' ? em : '',
  }
}

const COLUNAS_RELATORIO_HISTORICO =
  'id, user_id, tipo_relatorio, titulo, competencia, local_ref, local_nome, cabecalho, snapshot, impresso_em, created_at, pdf_assinado_url, profissional_emissor_id, assinado_em, status_workflow, anexos_urls, auditor_id, faturista_id'

export async function registrarRelatorioImpresso(
  userId: string,
  input: RegistrarRelatorioImpressoInput,
): Promise<RelatorioHistoricoRow> {
  const agora = new Date().toISOString()
  const { data, error } = await supabase
    .from('relatorios_historico')
    .insert({
      user_id: userId,
      tipo_relatorio: input.tipo_relatorio,
      titulo: input.titulo,
      competencia: input.competencia,
      local_ref: input.local_ref,
      local_nome: input.local_nome,
      cabecalho: input.cabecalho,
      snapshot: input.snapshot,
      impresso_em: agora,
      status_workflow: input.status_workflow ?? 'rascunho',
      anexos_urls: input.anexos_urls ?? [],
    })
    .select(COLUNAS_RELATORIO_HISTORICO)
    .single()

  if (error) throw new Error(error.message)
  return data as RelatorioHistoricoRow
}

export async function listarHistoricoRelatorios(
  userId: string,
  limite = 30,
): Promise<RelatorioHistoricoRow[]> {
  const { data, error } = await supabase
    .from('relatorios_historico')
    .select(COLUNAS_RELATORIO_HISTORICO)
    .eq('user_id', userId)
    .order('impresso_em', { ascending: false })
    .limit(limite)

  if (error) throw new Error(error.message)
  return (data ?? []) as RelatorioHistoricoRow[]
}

export async function atualizarStatusWorkflowRelatorio(
  userId: string,
  historicoId: string,
  input: AtualizarStatusWorkflowInput,
): Promise<RelatorioHistoricoRow> {
  const patch: Database['public']['Tables']['relatorios_historico']['Update'] = {
    status_workflow: input.status_workflow,
  }

  if (input.auditor_id !== undefined) {
    patch.auditor_id = input.auditor_id
  }
  if (input.faturista_id !== undefined) {
    patch.faturista_id = input.faturista_id
  }
  if (input.anexos_urls !== undefined) {
    patch.anexos_urls = input.anexos_urls
  }
  if (input.snapshot !== undefined) {
    patch.snapshot = input.snapshot
  }

  const { data, error } = await supabase
    .from('relatorios_historico')
    .update(patch)
    .eq('id', historicoId)
    .eq('user_id', userId)
    .select(COLUNAS_RELATORIO_HISTORICO)
    .single()

  if (error) throw new Error(error.message)
  return data as RelatorioHistoricoRow
}

export async function devolverRelatorioComObservacoes(
  userId: string,
  historicoId: string,
  params: {
    snapshot: Json
    observacao: string
    auditorId: string
  },
): Promise<RelatorioHistoricoRow> {
  return atualizarStatusWorkflowRelatorio(userId, historicoId, {
    status_workflow: 'rascunho',
    auditor_id: null,
    snapshot: mesclarSnapshotComObservacao(params.snapshot, params.observacao, params.auditorId),
  })
}

export async function excluirHistoricoRelatorio(
  userId: string,
  historicoId: string,
): Promise<void> {
  const { error } = await supabase
    .from('relatorios_historico')
    .delete()
    .eq('id', historicoId)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
}
