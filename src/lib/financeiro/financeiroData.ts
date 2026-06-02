import { supabase } from '../supabase'
import {
  calcularTotaisExtrato,
  calcularValorBrutoComRegras,
  REGRAS_REMUNERACAO_VAZIAS,
  valorFinalLinha,
  type LinhaExtratoFinanceiro,
  type TotaisExtratoFinanceiro,
} from './extratoCalculos'
import { buscarRegrasRemuneracao } from './remuneracaoDb'
import type { RegrasRemuneracao } from './remuneracaoTypes'

export type LinhaPlantaoFinanceiroRow = {
  id: string
  profissional_id: string | null
  data_plantao: string
  hora_inicio: string
  hora_fim: string
  valor_plantao: number | null
  remuneracao_tipo_id?: string | null
  ajuste_financeiro: number | null
  observacao_ajuste: string | null
  locais: { nome_fantasia: string } | null
  setores: { nome: string } | null
  profissionais: { nome: string; detalhes?: unknown } | null
}

function especialidadeDoProfissional(detalhes: unknown): string | null {
  if (!detalhes || typeof detalhes !== 'object') return null
  const e = (detalhes as { especialidade?: string }).especialidade
  return typeof e === 'string' && e.trim() ? e.trim() : null
}

export function mapPlantaoParaLinhaExtrato(
  r: LinhaPlantaoFinanceiroRow,
  regras: RegrasRemuneracao = REGRAS_REMUNERACAO_VAZIAS,
): LinhaExtratoFinanceiro {
  const calculo = calcularValorBrutoComRegras(
    {
      dataPlantao: r.data_plantao,
      horaInicio: r.hora_inicio,
      horaFim: r.hora_fim,
      valorPlantaoBase: Number(r.valor_plantao ?? 0),
      remuneracaoTipoId: r.remuneracao_tipo_id ?? null,
      especialidadeProfissional: especialidadeDoProfissional(r.profissionais?.detalhes),
    },
    regras,
  )

  return {
    plantaoId: r.id,
    dataPlantao: r.data_plantao,
    localNome: r.locais?.nome_fantasia?.trim() ?? '—',
    setorNome: r.setores?.nome?.trim() ?? '—',
    profissionalNome: r.profissionais?.nome?.trim() ?? '—',
    valorBase: calculo.valorBase,
    valorBruto: calculo.valorBruto,
    ajusteFinanceiro: Number(r.ajuste_financeiro ?? 0),
    observacaoAjuste: (r.observacao_ajuste ?? '').trim(),
    etiquetasRemuneracao: calculo.etiquetas,
  }
}

export async function buscarLinhasExtratoCompetencia(
  userId: string,
  dataInicioIso: string,
  dataFimIso: string,
  options?: { profissionalId?: string },
): Promise<LinhaExtratoFinanceiro[]> {
  let regras = REGRAS_REMUNERACAO_VAZIAS
  try {
    regras = await buscarRegrasRemuneracao(userId)
  } catch {
    regras = REGRAS_REMUNERACAO_VAZIAS
  }

  let q = supabase
    .from('plantoes')
    .select(
      `
      id,
      profissional_id,
      data_plantao,
      hora_inicio,
      hora_fim,
      valor_plantao,
      remuneracao_tipo_id,
      ajuste_financeiro,
      observacao_ajuste,
      locais ( nome_fantasia ),
      setores ( nome ),
      profissionais ( nome, detalhes )
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
  if (error) {
    if (
      error.message.includes('remuneracao_tipo_id') ||
      error.message.includes('schema')
    ) {
      let fq = supabase
        .from('plantoes')
        .select(
          `
          id,
          profissional_id,
          data_plantao,
          hora_inicio,
          hora_fim,
          valor_plantao,
          ajuste_financeiro,
          observacao_ajuste,
          locais ( nome_fantasia ),
          setores ( nome ),
          profissionais ( nome, detalhes )
        `,
        )
        .eq('user_id', userId)
        .eq('status', 'realizado')
        .gte('data_plantao', dataInicioIso)
        .lte('data_plantao', dataFimIso)
        .order('data_plantao', { ascending: true })
      if (options?.profissionalId) {
        fq = fq.eq('profissional_id', options.profissionalId)
      }
      const fallback = await fq
      if (fallback.error) throw new Error(fallback.error.message)
      const rows = (fallback.data ?? []) as unknown as LinhaPlantaoFinanceiroRow[]
      return rows.map((r) => mapPlantaoParaLinhaExtrato(r, regras))
    }
    throw new Error(error.message)
  }
  const rows = (data ?? []) as unknown as LinhaPlantaoFinanceiroRow[]
  return rows.map((r) => mapPlantaoParaLinhaExtrato(r, regras))
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

export async function buscarAgregadosFinanceirosPorProfissional(
  userId: string,
  dataInicioIso: string,
  dataFimIso: string,
): Promise<AgregadoProfissionalFinanceiro[]> {
  let regras = REGRAS_REMUNERACAO_VAZIAS
  try {
    regras = await buscarRegrasRemuneracao(userId)
  } catch {
    regras = REGRAS_REMUNERACAO_VAZIAS
  }

  const { data, error } = await supabase
    .from('plantoes')
    .select(
      `
      id,
      profissional_id,
      data_plantao,
      hora_inicio,
      hora_fim,
      valor_plantao,
      remuneracao_tipo_id,
      ajuste_financeiro,
      observacao_ajuste,
      locais ( nome_fantasia ),
      setores ( nome ),
      profissionais ( nome, detalhes )
    `,
    )
    .eq('user_id', userId)
    .eq('status', 'realizado')
    .gte('data_plantao', dataInicioIso)
    .lte('data_plantao', dataFimIso)
    .not('profissional_id', 'is', null)

  if (error) throw new Error(error.message)

  type Row = LinhaPlantaoFinanceiroRow & { profissional_id: string }

  const map = new Map<string, { nome: string; bruto: number; liquido: number; desc: number }>()

  for (const raw of (data ?? []) as unknown as Row[]) {
    const pid = raw.profissional_id
    if (!pid) continue
    const nome = raw.profissionais?.nome?.trim() ?? '—'
    const linha = mapPlantaoParaLinhaExtrato(raw, regras)
    const cur = map.get(pid) ?? { nome, bruto: 0, liquido: 0, desc: 0 }
    cur.nome = nome
    cur.bruto += linha.valorBruto
    cur.liquido += valorFinalLinha(linha.valorBruto, linha.ajusteFinanceiro)
    if (linha.ajusteFinanceiro < 0) cur.desc += -linha.ajusteFinanceiro
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
