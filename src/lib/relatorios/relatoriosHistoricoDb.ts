import { supabase } from '../supabase'
import type { Json } from '../../types/database.types'

export type TipoRelatorioHistorico =
  | 'FrequenciaSetor'
  | 'FrequenciaCoordenacao'
  | 'RelatorioSCIRAS'

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
}

export type RegistrarRelatorioImpressoInput = {
  tipo_relatorio: TipoRelatorioHistorico
  titulo: string
  competencia: string
  local_ref: string
  local_nome: string
  cabecalho: Json
  snapshot: Json
}

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
    })
    .select(
      'id, user_id, tipo_relatorio, titulo, competencia, local_ref, local_nome, cabecalho, snapshot, impresso_em, created_at, pdf_assinado_url, profissional_emissor_id, assinado_em',
    )
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
    .select(
      'id, user_id, tipo_relatorio, titulo, competencia, local_ref, local_nome, cabecalho, snapshot, impresso_em, created_at, pdf_assinado_url, profissional_emissor_id, assinado_em',
    )
    .eq('user_id', userId)
    .order('impresso_em', { ascending: false })
    .limit(limite)

  if (error) throw new Error(error.message)
  return (data ?? []) as RelatorioHistoricoRow[]
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
