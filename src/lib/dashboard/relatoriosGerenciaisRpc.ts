import { supabase } from '../supabase'
import type { PlantaoEscalaRow } from '../../pages/Dashboard/relatoriosGerenciaisTypes'

export type PlantoesPorMesRow = {
  mes: string
  total: number
  realizados: number
  vagos: number
  custo: number
}

export type ProfissionalRankingRow = {
  profissional_id: string
  nome: string
  horas: number
  plantoes: number
  valor_total: number
  taxa_presenca: number
}

export type ResumoSetorRow = {
  setor_id: string
  setor_nome: string
  local_nome: string
  total_plantoes: number
  cobertos: number
  vagos: number
  custo: number
}

export type ProfissionalSobrecargaRow = {
  profissional_id: string
  nome: string
  horas_semana: number
  plantoes_semana: number
}

function normalizarRpcArray<T>(data: unknown): T[] {
  return Array.isArray(data) ? (data as T[]) : []
}

function mapPlantoesPorMes(rows: PlantoesPorMesRow[]): PlantoesPorMesRow[] {
  return rows.map((r) => ({
    mes: r.mes,
    total: Number(r.total),
    realizados: Number(r.realizados),
    vagos: Number(r.vagos),
    custo: Number(r.custo),
  }))
}

function mapRanking(rows: ProfissionalRankingRow[]): ProfissionalRankingRow[] {
  return rows.map((r) => ({
    profissional_id: r.profissional_id,
    nome: r.nome,
    horas: Number(r.horas),
    plantoes: Number(r.plantoes),
    valor_total: Number(r.valor_total),
    taxa_presenca: Number(r.taxa_presenca),
  }))
}

function mapResumoSetor(rows: ResumoSetorRow[]): ResumoSetorRow[] {
  return rows.map((r) => ({
    setor_id: r.setor_id,
    setor_nome: r.setor_nome,
    local_nome: r.local_nome,
    total_plantoes: Number(r.total_plantoes),
    cobertos: Number(r.cobertos),
    vagos: Number(r.vagos),
    custo: Number(r.custo),
  }))
}

function mapSobrecarga(rows: ProfissionalSobrecargaRow[]): ProfissionalSobrecargaRow[] {
  return rows.map((r) => ({
    profissional_id: r.profissional_id,
    nome: r.nome,
    horas_semana: Number(r.horas_semana),
    plantoes_semana: Number(r.plantoes_semana),
  }))
}

export async function rpcPlantoesPorMes(
  localId?: string | null,
  meses = 12,
): Promise<PlantoesPorMesRow[]> {
  const { data, error } = await supabase.rpc('plantoes_por_mes', {
    p_local_id: localId ?? null,
    p_meses: meses,
  })
  if (error) throw new Error(error.message)
  return mapPlantoesPorMes(normalizarRpcArray<PlantoesPorMesRow>(data))
}

export async function rpcProfissionaisRanking(
  competencia: string,
  localId?: string | null,
): Promise<ProfissionalRankingRow[]> {
  const { data, error } = await supabase.rpc('profissionais_ranking', {
    p_competencia: competencia,
    p_local_id: localId ?? null,
  })
  if (error) throw new Error(error.message)
  return mapRanking(normalizarRpcArray<ProfissionalRankingRow>(data))
}

export async function rpcResumoSetor(competencia: string): Promise<ResumoSetorRow[]> {
  const { data, error } = await supabase.rpc('resumo_setor', {
    p_competencia: competencia,
  })
  if (error) throw new Error(error.message)
  return mapResumoSetor(normalizarRpcArray<ResumoSetorRow>(data))
}

export async function rpcProfissionaisSobrecarga(
  semanaInicio: string,
): Promise<ProfissionalSobrecargaRow[]> {
  const { data, error } = await supabase.rpc('profissionais_sobrecarga', {
    p_semana_inicio: semanaInicio,
  })
  if (error) throw new Error(error.message)
  return mapSobrecarga(normalizarRpcArray<ProfissionalSobrecargaRow>(data))
}

/** Plantões brutos para montar grade de escala no intervalo. */
export async function buscarPlantoesRelatorioEscala(params: {
  tenantUserId: string
  dataInicio: string
  dataFim: string
  localId?: string
  setorIds?: string[]
}): Promise<PlantaoEscalaRow[]> {
  let query = supabase
    .from('plantoes')
    .select(
      `
      id,
      data_plantao,
      hora_inicio,
      hora_fim,
      status,
      profissional_id,
      setor_id,
      local_id,
      profissionais ( nome, conselho_numero, telefone ),
      setores ( nome, ativo )
    `,
    )
    .eq('user_id', params.tenantUserId)
    .gte('data_plantao', params.dataInicio)
    .lte('data_plantao', params.dataFim)
    .order('data_plantao')
    .order('hora_inicio')

  if (params.localId) {
    query = query.eq('local_id', params.localId)
  }
  if (params.setorIds && params.setorIds.length > 0) {
    query = query.in('setor_id', params.setorIds)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as PlantaoEscalaRow[]
}

/** Telefones dos profissionais para o relatório de pagamentos. */
export async function buscarTelefonesProfissionais(
  tenantUserId: string,
  profissionalIds: string[],
): Promise<Map<string, string>> {
  if (profissionalIds.length === 0) return new Map()

  const { data, error } = await supabase
    .from('profissionais')
    .select('id, telefone')
    .eq('user_id', tenantUserId)
    .in('id', profissionalIds)

  if (error) throw new Error(error.message)

  const map = new Map<string, string>()
  for (const row of data ?? []) {
    map.set(row.id, row.telefone?.trim() ?? '')
  }
  return map
}

/** Meses únicos (YYYY-MM) cobertos por um intervalo de datas. */
export function mesesNoIntervalo(dataInicio: string, dataFim: string): string[] {
  const inicio = new Date(dataInicio + 'T12:00:00')
  const fim = new Date(dataFim + 'T12:00:00')
  const meses: string[] = []
  const cursor = new Date(inicio.getFullYear(), inicio.getMonth(), 1)
  const ultimo = new Date(fim.getFullYear(), fim.getMonth(), 1)

  while (cursor <= ultimo) {
    const y = cursor.getFullYear()
    const m = String(cursor.getMonth() + 1).padStart(2, '0')
    meses.push(`${y}-${m}`)
    cursor.setMonth(cursor.getMonth() + 1)
  }
  return meses
}

/** Agrega ranking de vários meses num único ranking por profissional. */
export function agregarRankingsMultiplosMeses(
  rankings: ProfissionalRankingRow[][],
): ProfissionalRankingRow[] {
  const map = new Map<string, ProfissionalRankingRow>()

  for (const lista of rankings) {
    for (const r of lista) {
      const existente = map.get(r.profissional_id)
      if (!existente) {
        map.set(r.profissional_id, { ...r })
        continue
      }
      existente.horas = Number((existente.horas + r.horas).toFixed(2))
      existente.plantoes += r.plantoes
      existente.valor_total = Number((existente.valor_total + r.valor_total).toFixed(2))
      existente.taxa_presenca = Number(
        ((existente.taxa_presenca + r.taxa_presenca) / 2).toFixed(2),
      )
    }
  }

  return [...map.values()].sort((a, b) => b.valor_total - a.valor_total)
}
