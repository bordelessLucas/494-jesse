import {
  addHours,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameMonth,
  isWeekend,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

import {
  chaveDataPlantaoDb,
  dataLocalAPartirDeIsoData,
  formatarHoraDb,
} from '../escalas/plantoesDb'
import type { PlantaoDashboardRow } from './dashboardQueries'
import { duracaoHorasPlantao } from './plantaoHoras'

export type ItemLista48h = {
  id: string
  titulo: string
  local: string
  inicioRelativo: string
}

export type LinhaRankingSemana = {
  n: number
  profissionalId: string
  nome: string
  realizados: number
  horas: string
  coberturas: number
}

export type FatiaDonutMes = {
  tipo: string
  total: number
  furos: number
  cor: string
}

export type PontoGraficoMeses = {
  chave: string
  rotulo: string
  total: number
  coberturas: number
  furos: number
}

export function dataHoraInicioPlantao(row: PlantaoDashboardRow): Date {
  const d = dataLocalAPartirDeIsoData(row.data_plantao)
  const h = formatarHoraDb(row.hora_inicio)
  const [hh, mm] = h.split(':').map(Number)
  d.setHours(hh ?? 0, mm ?? 0, 0, 0)
  return d
}

function classificarTipoPlantao(row: PlantaoDashboardRow): 'normal' | 'fds' | 'noturno' {
  const d = dataLocalAPartirDeIsoData(row.data_plantao)
  if (isWeekend(d)) return 'fds'
  const h = formatarHoraDb(row.hora_inicio)
  const hi = parseInt(h.slice(0, 2), 10)
  if (hi >= 19 || hi < 7) return 'noturno'
  return 'normal'
}

function inIntervalo48h(row: PlantaoDashboardRow, agora: Date, fim48: Date): boolean {
  const dt = dataHoraInicioPlantao(row)
  return !isBefore(dt, agora) && !isAfter(dt, fim48)
}

export function rotuloInicioRelativo(row: PlantaoDashboardRow, agora: Date): string {
  const dt = dataHoraInicioPlantao(row)
  const diffMs = dt.getTime() - agora.getTime()
  const diffH = Math.floor(diffMs / (1000 * 60 * 60))

  if (
    isSameMonth(dt, agora) &&
    format(dt, 'yyyy-MM-dd') === format(agora, 'yyyy-MM-dd')
  ) {
    if (diffH < 1) return 'Em breve'
    if (diffH < 24) return `Em ${diffH} h`
  }
  const hoje = startOfDay(agora)
  const diaPlantao = startOfDay(dt)
  if (diaPlantao.getTime() === hoje.getTime() + 86400000) {
    return `Amanhã · ${formatarHoraDb(row.hora_inicio)}`
  }
  return `${format(dt, 'dd MMM', { locale: ptBR })} · ${formatarHoraDb(row.hora_inicio)}`
}

export function agregarContagens48h(
  linhas: PlantaoDashboardRow[],
  agora: Date,
): { furos: number; anunciados: number; trocas: number; candidaturas: number } {
  const fim48 = addHours(agora, 48)
  const noIntervalo = linhas.filter((r) => inIntervalo48h(r, agora, fim48))
  return {
    furos: noIntervalo.filter((r) => r.status === 'vago').length,
    anunciados: noIntervalo.filter(
      (r) => r.status !== 'vago' && r.status !== 'realizado',
    ).length,
    trocas: 0,
    candidaturas: 0,
  }
}

export function listarVagos48hParaPainel(
  linhas: PlantaoDashboardRow[],
  agora: Date,
): ItemLista48h[] {
  const fim48 = addHours(agora, 48)
  return linhas
    .filter((r) => inIntervalo48h(r, agora, fim48))
    .filter((r) => r.status === 'vago')
    .sort(
      (a, b) =>
        dataHoraInicioPlantao(a).getTime() - dataHoraInicioPlantao(b).getTime(),
    )
    .map((r) => {
      const setor = r.setores?.nome?.trim() ?? 'Setor'
      const local = r.locais?.nome_fantasia?.trim() ?? 'Local'
      return {
        id: r.id,
        titulo: `${setor} — ${formatarHoraDb(r.hora_inicio)} às ${formatarHoraDb(
          r.hora_fim,
        )}`,
        local,
        inicioRelativo: rotuloInicioRelativo(r, agora),
      }
    })
}

export function listarPlantoes48hParaPainel(
  linhas: PlantaoDashboardRow[],
  agora: Date,
): ItemLista48h[] {
  const fim48 = addHours(agora, 48)
  return linhas
    .filter((r) => inIntervalo48h(r, agora, fim48))
    .filter((r) => r.status === 'pendente' || r.status === 'confirmado')
    .sort(
      (a, b) =>
        dataHoraInicioPlantao(a).getTime() - dataHoraInicioPlantao(b).getTime(),
    )
    .map((r) => {
      const setor = r.setores?.nome?.trim() ?? 'Setor'
      const local = r.locais?.nome_fantasia?.trim() ?? 'Local'
      return {
        id: r.id,
        titulo: `${setor} — ${formatarHoraDb(r.hora_inicio)} às ${formatarHoraDb(
          r.hora_fim,
        )}`,
        local,
        inicioRelativo: rotuloInicioRelativo(r, agora),
      }
    })
}

export function agregarDonutPeriodo(
  linhas: PlantaoDashboardRow[],
  inicio: Date,
  fim: Date,
): { fatias: FatiaDonutMes[]; totalPlantoes: number } {
  const noPeriodo = linhas.filter((r) => {
    const d = dataLocalAPartirDeIsoData(r.data_plantao)
    return d >= inicio && d <= fim
  })

  let nNormal = 0
  let nFds = 0
  let nNot = 0
  let fNormal = 0
  let fFds = 0
  let fNot = 0
  for (const r of noPeriodo) {
    const tipo = classificarTipoPlantao(r)
    const vago = r.status === 'vago'
    if (tipo === 'fds') {
      nFds++
      if (vago) fFds++
    } else if (tipo === 'noturno') {
      nNot++
      if (vago) fNot++
    } else {
      nNormal++
      if (vago) fNormal++
    }
  }

  const totalPlantoes = noPeriodo.length
  const fatias: FatiaDonutMes[] = [
    { tipo: 'Normal', total: nNormal, furos: fNormal, cor: 'bg-slate-300' },
    { tipo: 'Fim de semana', total: nFds, furos: fFds, cor: 'bg-warning-500' },
    { tipo: 'Noturno', total: nNot, furos: fNot, cor: 'bg-primary-600' },
  ]

  return { fatias, totalPlantoes }
}

export function agregarDonutMesAnterior(
  linhas: PlantaoDashboardRow[],
  referencia: Date,
): { fatias: FatiaDonutMes[]; totalPlantoes: number } {
  const ref = subMonths(referencia, 1)
  const ini = startOfMonth(ref)
  const fim = endOfMonth(ref)
  const noMes = linhas.filter((r) => {
    const d = dataLocalAPartirDeIsoData(r.data_plantao)
    return d >= ini && d <= fim
  })

  let nNormal = 0
  let nFds = 0
  let nNot = 0
  let fNormal = 0
  let fFds = 0
  let fNot = 0
  for (const r of noMes) {
    const tipo = classificarTipoPlantao(r)
    const vago = r.status === 'vago'
    if (tipo === 'fds') {
      nFds++
      if (vago) fFds++
    } else if (tipo === 'noturno') {
      nNot++
      if (vago) fNot++
    } else {
      nNormal++
      if (vago) fNormal++
    }
  }

  const totalPlantoes = noMes.length
  const fatias: FatiaDonutMes[] = [
    { tipo: 'Normal', total: nNormal, furos: fNormal, cor: 'bg-slate-300' },
    { tipo: 'Fim de semana', total: nFds, furos: fFds, cor: 'bg-warning-500' },
    { tipo: 'Noturno', total: nNot, furos: fNot, cor: 'bg-primary-600' },
  ]

  return { fatias, totalPlantoes }
}

export function rankingProfissionaisSemana(
  linhas: PlantaoDashboardRow[],
  referencia: Date,
  limite = 10,
): LinhaRankingSemana[] {
  const ini = startOfWeek(referencia, { weekStartsOn: 1 })
  const fim = endOfWeek(referencia, { weekStartsOn: 1 })
  const naSemana = linhas.filter((r) => {
    const chave = chaveDataPlantaoDb(r.data_plantao)
    return chave >= format(ini, 'yyyy-MM-dd') && chave <= format(fim, 'yyyy-MM-dd')
  })

  const mapa = new Map<
    string,
    { nome: string; horas: number; realizados: number; cobertos: number }
  >()

  for (const r of naSemana) {
    if (!r.profissional_id || r.status === 'vago') continue
    const nome = r.profissionais?.nome?.trim() ?? 'Profissional'
    const h = duracaoHorasPlantao(r.data_plantao, r.hora_inicio, r.hora_fim)
    const cur = mapa.get(r.profissional_id) ?? {
      nome,
      horas: 0,
      realizados: 0,
      cobertos: 0,
    }
    cur.horas += h
    cur.realizados += 1
    if (r.status === 'realizado') cur.cobertos += 1
    mapa.set(r.profissional_id, cur)
  }

  const ordenado = Array.from(mapa.entries())
    .map(([profissionalId, v]) => ({
      profissionalId,
      nome: v.nome,
      realizados: v.realizados,
      horasNum: v.horas,
      coberturas: v.cobertos,
    }))
    .sort((a, b) => b.horasNum - a.horasNum)
    .slice(0, limite)

  return ordenado.map((row, i) => ({
    n: i + 1,
    profissionalId: row.profissionalId,
    nome: row.nome,
    realizados: row.realizados,
    horas: `${Math.round(row.horasNum)}h`,
    coberturas: row.coberturas,
  }))
}

export function serieMensalPlantoes(
  linhas: PlantaoDashboardRow[],
  referencia: Date,
  meses = 7,
): PontoGraficoMeses[] {
  const pontos: PontoGraficoMeses[] = []
  for (let i = meses - 1; i >= 0; i--) {
    const mesRef = subMonths(referencia, i)
    const chave = format(mesRef, 'yyyy-MM')
    const ini = startOfMonth(mesRef)
    const fim = endOfMonth(mesRef)
    const noMes = linhas.filter((r) => {
      const d = dataLocalAPartirDeIsoData(r.data_plantao)
      return d >= ini && d <= fim
    })
    const total = noMes.length
    const coberturas = noMes.filter((r) => r.status !== 'vago').length
    const furos = noMes.filter((r) => r.status === 'vago').length
    pontos.push({
      chave,
      rotulo: format(mesRef, 'MMM', { locale: ptBR }),
      total,
      coberturas,
      furos,
    })
  }
  return pontos
}

export function maximoSerieGrafico(pontos: PontoGraficoMeses[]): number {
  const m = Math.max(
    1,
    ...pontos.map((p) => Math.max(p.total, p.coberturas, p.furos)),
  )
  const step = m <= 50 ? 10 : m <= 200 ? 25 : m <= 600 ? 50 : 100
  return Math.ceil(m / step) * step
}

export function filtrarPorSetor(
  linhas: PlantaoDashboardRow[],
  setorId: string,
): PlantaoDashboardRow[] {
  if (!setorId) return linhas
  return linhas.filter((r) => r.setor_id === setorId)
}
