import {
  addWeeks,
  endOfMonth,
  endOfQuarter,
  endOfWeek,
  endOfYear,
  format,
  isAfter,
  isBefore,
  startOfMonth,
  startOfQuarter,
  startOfWeek,
  startOfYear,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { calcularValorBrutoComRegras, REGRAS_REMUNERACAO_VAZIAS } from '../financeiro/extratoCalculos'
import type { RegrasRemuneracao } from '../financeiro/remuneracaoTypes'
import {
  chaveDataPlantaoDb,
} from '../escalas/plantoesDb'
import type { PlantaoDashboardRow } from './dashboardQueries'
import { duracaoHorasPlantao } from './plantaoHoras'

export type PeriodoBi = 'mes' | 'trimestre' | 'ano'

/** Meta mínima de cobertura por setor/dia — alinhado ao padrão da escala mensal até existir cadastro. */
export const META_MINIMA_COBERTURA_PADRAO = 2

export type IntervaloBi = { inicio: Date; fim: Date }

export function intervaloPeriodoBi(periodo: PeriodoBi, referencia: Date): IntervaloBi {
  switch (periodo) {
    case 'trimestre':
      return { inicio: startOfQuarter(referencia), fim: endOfQuarter(referencia) }
    case 'ano':
      return { inicio: startOfYear(referencia), fim: endOfYear(referencia) }
    default:
      return { inicio: startOfMonth(referencia), fim: endOfMonth(referencia) }
  }
}

export function rotuloPeriodoBi(periodo: PeriodoBi): string {
  switch (periodo) {
    case 'trimestre':
      return 'trimestre'
    case 'ano':
      return 'ano corrente'
    default:
      return 'mês atual'
  }
}

export function plantoesNoIntervalo(
  linhas: PlantaoDashboardRow[],
  intervalo: IntervaloBi,
): PlantaoDashboardRow[] {
  const minChave = format(intervalo.inicio, 'yyyy-MM-dd')
  const maxChave = format(intervalo.fim, 'yyyy-MM-dd')
  return linhas.filter((r) => {
    const chave = chaveDataPlantaoDb(r.data_plantao)
    return chave >= minChave && chave <= maxChave
  })
}

function especialidadeDoProfissional(detalhes: unknown): string | null {
  if (!detalhes || typeof detalhes !== 'object') return null
  const e = (detalhes as { especialidade?: string }).especialidade
  return typeof e === 'string' && e.trim() ? e.trim() : null
}

function valorBrutoPlantao(
  row: PlantaoDashboardRow,
  regras: RegrasRemuneracao,
): number {
  const calculo = calcularValorBrutoComRegras(
    {
      dataPlantao: row.data_plantao,
      horaInicio: row.hora_inicio,
      horaFim: row.hora_fim,
      valorPlantaoBase: Number(row.valor_plantao ?? 0),
      remuneracaoTipoId: row.remuneracao_tipo_id ?? null,
      especialidadeProfissional: especialidadeDoProfissional(row.profissionais?.detalhes),
    },
    regras,
  )
  return calculo.valorBruto
}

export type MetricasBi = {
  custoTotalEscala: number
  totalBrutoEscala: number
  totalGlosas: number
  taxaGlosasPct: number
  eficienciaCoberturaPct: number
  diasComMeta: number
  diasAvaliados: number
}

export function calcularMetricasBi(
  linhas: PlantaoDashboardRow[],
  intervalo: IntervaloBi,
  regras: RegrasRemuneracao = REGRAS_REMUNERACAO_VAZIAS,
  metaMinima = META_MINIMA_COBERTURA_PADRAO,
): MetricasBi {
  const noPeriodo = plantoesNoIntervalo(linhas, intervalo)
  const regrasUsadas = regras ?? REGRAS_REMUNERACAO_VAZIAS

  let custoTotalEscala = 0
  let totalBrutoEscala = 0
  let totalGlosas = 0

  for (const r of noPeriodo) {
    const bruto = valorBrutoPlantao(r, regrasUsadas)
    totalBrutoEscala += bruto
    const ajuste = Number(r.ajuste_financeiro ?? 0)
    if (ajuste < 0) totalGlosas += -ajuste
    if (r.status === 'realizado') custoTotalEscala += bruto + ajuste
  }

  const { diasComMeta, diasAvaliados } = avaliarDiasCobertura(noPeriodo, metaMinima)
  const taxaGlosasPct =
    totalBrutoEscala > 0 ? (totalGlosas / totalBrutoEscala) * 100 : 0
  const eficienciaCoberturaPct =
    diasAvaliados > 0 ? (diasComMeta / diasAvaliados) * 100 : 100

  return {
    custoTotalEscala: arred2(custoTotalEscala),
    totalBrutoEscala: arred2(totalBrutoEscala),
    totalGlosas: arred2(totalGlosas),
    taxaGlosasPct: arred2(taxaGlosasPct),
    eficienciaCoberturaPct: arred2(eficienciaCoberturaPct),
    diasComMeta,
    diasAvaliados,
  }
}

function avaliarDiasCobertura(
  linhas: PlantaoDashboardRow[],
  metaMinima: number,
): { diasComMeta: number; diasAvaliados: number } {
  const porDiaSetor = new Map<string, { cobertos: number }>()

  for (const r of linhas) {
    const chave = `${r.setor_id}|${chaveDataPlantaoDb(r.data_plantao)}`
    const cur = porDiaSetor.get(chave) ?? { cobertos: 0 }
    if (r.status !== 'vago' && r.profissional_id) cur.cobertos += 1
    porDiaSetor.set(chave, cur)
  }

  let diasComMeta = 0
  let diasAvaliados = 0
  for (const { cobertos } of porDiaSetor.values()) {
    diasAvaliados += 1
    if (cobertos >= metaMinima) diasComMeta += 1
  }

  return { diasComMeta, diasAvaliados }
}

export type BarraSetorCusto = {
  setorId: string
  setorNome: string
  custo: number
}

export function custoPorSetorOrdenado(
  linhas: PlantaoDashboardRow[],
  intervalo: IntervaloBi,
  regras: RegrasRemuneracao = REGRAS_REMUNERACAO_VAZIAS,
): BarraSetorCusto[] {
  const noPeriodo = plantoesNoIntervalo(linhas, intervalo).filter(
    (r) => r.status === 'realizado',
  )
  const regrasUsadas = regras ?? REGRAS_REMUNERACAO_VAZIAS
  const mapa = new Map<string, { nome: string; custo: number }>()

  for (const r of noPeriodo) {
    const bruto = valorBrutoPlantao(r, regrasUsadas)
    const ajuste = Number(r.ajuste_financeiro ?? 0)
    const custo = bruto + ajuste
    const nome = r.setores?.nome?.trim() ?? 'Setor'
    const cur = mapa.get(r.setor_id) ?? { nome, custo: 0 }
    cur.custo += custo
    mapa.set(r.setor_id, cur)
  }

  return Array.from(mapa.entries())
    .map(([setorId, v]) => ({
      setorId,
      setorNome: v.nome,
      custo: arred2(v.custo),
    }))
    .sort((a, b) => b.custo - a.custo)
}

export type PontoSemanaCobertura = {
  chave: string
  rotulo: string
  confirmados: number
  furos: number
}

export function serieCoberturaSemanal(
  linhas: PlantaoDashboardRow[],
  intervalo: IntervaloBi,
): PontoSemanaCobertura[] {
  const pontos: PontoSemanaCobertura[] = []
  let semanaIni = startOfWeek(intervalo.inicio, { weekStartsOn: 1 })

  while (!isAfter(semanaIni, intervalo.fim)) {
    const semanaFim = endOfWeek(semanaIni, { weekStartsOn: 1 })
    const iniEfetivo = isBefore(semanaIni, intervalo.inicio) ? intervalo.inicio : semanaIni
    const fimEfetivo = isAfter(semanaFim, intervalo.fim) ? intervalo.fim : semanaFim

    const minChave = format(iniEfetivo, 'yyyy-MM-dd')
    const maxChave = format(fimEfetivo, 'yyyy-MM-dd')

    const naSemana = linhas.filter((r) => {
      const chave = chaveDataPlantaoDb(r.data_plantao)
      return chave >= minChave && chave <= maxChave
    })

    const confirmados = naSemana.filter((r) => r.status !== 'vago').length
    const furos = naSemana.filter((r) => r.status === 'vago').length
    const chave = format(semanaIni, 'yyyy-MM-dd')

    pontos.push({
      chave,
      rotulo: format(semanaIni, 'dd MMM', { locale: ptBR }),
      confirmados,
      furos,
    })

    semanaIni = addWeeks(semanaIni, 1)
  }

  return pontos
}

export type LinhaRankingPeriodo = {
  n: number
  profissionalId: string
  nome: string
  realizados: number
  horas: string
  horasNum: number
  fotoUrl: string | null
}

export function fotoUrlProfissional(detalhes: unknown): string | null {
  const d = detalhes as { fotoUrl?: string | null } | null
  const u = d?.fotoUrl?.trim()
  return u || null
}

export function rankingProfissionaisPeriodo(
  linhas: PlantaoDashboardRow[],
  intervalo: IntervaloBi,
  limite = 5,
): LinhaRankingPeriodo[] {
  const noPeriodo = plantoesNoIntervalo(linhas, intervalo)
  const mapa = new Map<
    string,
    { nome: string; horas: number; realizados: number; fotoUrl: string | null }
  >()

  for (const r of noPeriodo) {
    if (!r.profissional_id || r.status === 'vago') continue
    const nome = r.profissionais?.nome?.trim() ?? 'Profissional'
    const h = duracaoHorasPlantao(r.data_plantao, r.hora_inicio, r.hora_fim)
    const cur = mapa.get(r.profissional_id) ?? {
      nome,
      horas: 0,
      realizados: 0,
      fotoUrl: fotoUrlProfissional(r.profissionais?.detalhes),
    }
    cur.horas += h
    cur.realizados += 1
    if (!cur.fotoUrl) {
      cur.fotoUrl = fotoUrlProfissional(r.profissionais?.detalhes)
    }
    mapa.set(r.profissional_id, cur)
  }

  const ordenado = Array.from(mapa.entries())
    .map(([profissionalId, v]) => ({
      profissionalId,
      nome: v.nome,
      realizados: v.realizados,
      horasNum: v.horas,
      fotoUrl: v.fotoUrl,
    }))
    .sort((a, b) => b.realizados - a.realizados || b.horasNum - a.horasNum)
    .slice(0, limite)

  return ordenado.map((row, i) => ({
    n: i + 1,
    profissionalId: row.profissionalId,
    nome: row.nome,
    realizados: row.realizados,
    horasNum: row.horasNum,
    horas: `${Math.round(row.horasNum)}h`,
    fotoUrl: row.fotoUrl,
  }))
}

export function maximoSerieNumerica(valores: number[]): number {
  const m = Math.max(1, ...valores)
  const step = m <= 20 ? 5 : m <= 50 ? 10 : m <= 200 ? 25 : 50
  return Math.ceil(m / step) * step
}

function arred2(n: number): number {
  return Number(n.toFixed(2))
}
