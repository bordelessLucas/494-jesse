import { supabase } from '../supabase'
import {
  calcularTotaisExtrato,
  valorFinalLinha,
  type LinhaExtratoFinanceiro,
  type TotaisExtratoFinanceiro,
} from './extratoCalculos'

export type LinhaPlantaoFinanceiroRow = {
  id: string
  profissional_id: string | null
  data_plantao: string
  valor_plantao: number | null
  ajuste_financeiro: number | null
  observacao_ajuste: string | null
  locais: { nome_fantasia: string } | null
  setores: { nome: string } | null
  profissionais: { nome: string } | null
}

export function mapPlantaoParaLinhaExtrato(
  r: LinhaPlantaoFinanceiroRow,
): LinhaExtratoFinanceiro {
  return {
    plantaoId: r.id,
    dataPlantao: r.data_plantao,
    localNome: r.locais?.nome_fantasia?.trim() ?? '—',
    setorNome: r.setores?.nome?.trim() ?? '—',
    profissionalNome: r.profissionais?.nome?.trim() ?? '—',
    valorBruto: Number(r.valor_plantao ?? 0),
    ajusteFinanceiro: Number(r.ajuste_financeiro ?? 0),
    observacaoAjuste: (r.observacao_ajuste ?? '').trim(),
  }
}

export async function buscarLinhasExtratoCompetencia(
  userId: string,
  dataInicioIso: string,
  dataFimIso: string,
  options?: { profissionalId?: string },
): Promise<LinhaExtratoFinanceiro[]> {
  let q = supabase
    .from('plantoes')
    .select(
      `
      id,
      profissional_id,
      data_plantao,
      valor_plantao,
      ajuste_financeiro,
      observacao_ajuste,
      locais ( nome_fantasia ),
      setores ( nome ),
      profissionais ( nome )
    `,
    )
    .eq('user_id', userId)
    .eq('status', 'realizado')
    .gte('data_plantao', dataInicioIso)
    .lte('data_plantao', dataFimIso)
    .order('data_plantao', { ascending: true })

  if (options?.profissionalId) {
    q = q.eq('profissional_id', options.profissionalId)
  }

  const { data, error } = await q
  if (error) throw new Error(error.message)
  const rows = (data ?? []) as LinhaPlantaoFinanceiroRow[]
  return rows.map(mapPlantaoParaLinhaExtrato)
}

export type ExtratoPeriodoResumo = {
  id: string
  profissional_id: string
  competencia: string
  fechado_em: string | null
  status_financeiro: string
  extrato_fechado: boolean | null
}

export async function buscarExtratosPeriodoPorCompetencia(
  userId: string,
  competencia: string,
): Promise<ExtratoPeriodoResumo[]> {
  const { data, error } = await supabase
    .from('financeiro_extrato_periodo')
    .select('id, profissional_id, competencia, fechado_em, status_financeiro, extrato_fechado')
    .eq('user_id', userId)
    .eq('competencia', competencia)

  if (error) throw new Error(error.message)
  return (data ?? []) as ExtratoPeriodoResumo[]
}

export type AgregadoProfissionalFinanceiro = {
  profissionalId: string
  nome: string
  totalBruto: number
  totalLiquido: number
  totalDescontosGlosas: number
}

/**
 * Agrupa plantões realizados por `profissional_id` com totais financeiros.
 */
export async function buscarAgregadosFinanceirosPorProfissional(
  userId: string,
  dataInicioIso: string,
  dataFimIso: string,
): Promise<AgregadoProfissionalFinanceiro[]> {
  const { data, error } = await supabase
    .from('plantoes')
    .select(
      `
      profissional_id,
      valor_plantao,
      ajuste_financeiro,
      profissionais ( id, nome )
    `,
    )
    .eq('user_id', userId)
    .eq('status', 'realizado')
    .gte('data_plantao', dataInicioIso)
    .lte('data_plantao', dataFimIso)
    .not('profissional_id', 'is', null)

  if (error) throw new Error(error.message)

  type Row = {
    profissional_id: string | null
    valor_plantao: number | null
    ajuste_financeiro: number | null
    profissionais: { id: string; nome: string } | null
  }

  const map = new Map<string, { nome: string; bruto: number; liquido: number; desc: number }>()

  for (const raw of (data ?? []) as Row[]) {
    const pid = raw.profissional_id
    if (!pid) continue
    const nome = raw.profissionais?.nome?.trim() ?? '—'
    const bruto = Number(raw.valor_plantao ?? 0)
    const ajuste = Number(raw.ajuste_financeiro ?? 0)
    const liquido = valorFinalLinha(bruto, ajuste)
    const cur = map.get(pid) ?? { nome, bruto: 0, liquido: 0, desc: 0 }
    cur.nome = nome
    cur.bruto += bruto
    cur.liquido += liquido
    if (ajuste < 0) cur.desc += -ajuste
    map.set(pid, cur)
  }

  return Array.from(map.entries())
    .map(([profissionalId, v]) => ({
      profissionalId,
      nome: v.nome,
      totalBruto: Number(v.bruto.toFixed(2)),
      totalLiquido: Number(v.liquido.toFixed(2)),
      totalDescontosGlosas: Number(v.desc.toFixed(2)),
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
}

export async function buscarProfissionaisLista(
  userId: string,
): Promise<{ id: string; nome: string }[]> {
  const { data, error } = await supabase
    .from('profissionais')
    .select('id, nome')
    .eq('user_id', userId)
    .order('nome', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as { id: string; nome: string }[]
}

export async function carregarResumoCompetencia(
  userId: string,
  competencia: string,
  dataInicioIso: string,
  dataFimIso: string,
): Promise<{
  linhas: LinhaExtratoFinanceiro[]
  totais: TotaisExtratoFinanceiro
  periodos: ExtratoPeriodoResumo[]
}> {
  const [linhas, periodos] = await Promise.all([
    buscarLinhasExtratoCompetencia(userId, dataInicioIso, dataFimIso),
    buscarExtratosPeriodoPorCompetencia(userId, competencia),
  ])
  return {
    linhas,
    totais: calcularTotaisExtrato(linhas),
    periodos,
  }
}

export async function atualizarStatusExtratoParaPago(
  userId: string,
  periodoId: string,
): Promise<void> {
  const { error } = await supabase
    .from('financeiro_extrato_periodo')
    .update({
      status_financeiro: 'pago',
      updated_at: new Date().toISOString(),
    })
    .eq('id', periodoId)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
}
