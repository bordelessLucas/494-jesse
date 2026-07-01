import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

import type { PlantaoEscalaRow } from '../../pages/Dashboard/relatoriosGerenciaisTypes'
import {
  abreviarNomePega,
  faixaTurnoEscala,
  FAIXAS_TURNO_ESCALA,
} from './formatoPegaPlantao'
import { formatarHoraDb } from '../escalas/plantoesDb'

export type CelulaEscalaPega = {
  linhas: string[]
}

export type LinhaFaixaEscalaPega = {
  faixaRotulo: string
  dias: CelulaEscalaPega[]
}

export type SemanaEscalaPega = {
  rotulosDias: string[]
  faixas: LinhaFaixaEscalaPega[]
}

function rotuloDiaSemana(iso: string): string {
  const d = parseISO(iso)
  const abrev = format(d, 'EEE', { locale: ptBR }).slice(0, 3).toUpperCase()
  return `${abrev} ${format(d, 'dd/MM')}`
}

function plantaoPassaFiltroTurno(
  horaInicio: string,
  tipoTurno?: 'Todos' | 'Diurno' | 'Noturno' | '24h',
): boolean {
  if (!tipoTurno || tipoTurno === 'Todos' || tipoTurno === '24h') return true
  const h = parseInt(formatarHoraDb(horaInicio).slice(0, 2), 10)
  if (!Number.isFinite(h)) return true
  switch (tipoTurno) {
    case 'Diurno':
      return h >= 6 && h < 19
    case 'Noturno':
      return h >= 19 || h < 6
    default:
      return true
  }
}

function linhaProfissionalCelula(
  row: PlantaoEscalaRow,
  plantoesCobertura: Set<string>,
  modo: 'Nome completo' | 'Nome abreviado' | 'CRM',
): string {
  const nome = row.profissionais?.nome?.trim()
  if (!nome) return '—'

  let rotulo: string
  switch (modo) {
    case 'CRM':
      rotulo = row.profissionais?.conselho_numero?.trim() || nome
      break
    case 'Nome abreviado':
      rotulo = abreviarNomePega(nome)
      break
    default:
      rotulo = nome
  }

  if (plantoesCobertura.has(row.id)) {
    return `(CO) ${rotulo}`
  }
  return rotulo
}

/**
 * Grade semanal estilo Pega Plantão: colunas SEG–DOM, faixas 07–13 / 13–19 / 19–07.
 */
export function montarGradeEscalaPegaPlantao(
  dataInicio: string,
  dataFim: string,
  plantoes: PlantaoEscalaRow[],
  opcoes?: {
    setorIds?: string[]
    incluirSetoresInativos?: boolean
    tipoTurno?: 'Todos' | 'Diurno' | 'Noturno' | '24h'
    identificarProfissional?: 'Nome completo' | 'Nome abreviado' | 'CRM'
    plantoesCobertura?: Set<string>
  },
): SemanaEscalaPega[] {
  const ref = parseISO(dataInicio)
  const mesIni = startOfMonth(ref)
  const mesFim = endOfMonth(ref)

  const setorIds = opcoes?.setorIds ?? []
  const cobertura = opcoes?.plantoesCobertura ?? new Set<string>()
  const modo = opcoes?.identificarProfissional ?? 'Nome abreviado'

  const filtrados = plantoes.filter((p) => {
    if (setorIds.length > 0 && !setorIds.includes(p.setor_id)) return false
    if (!opcoes?.incluirSetoresInativos && p.setores?.ativo === false) return false
    if (!plantaoPassaFiltroTurno(p.hora_inicio, opcoes?.tipoTurno)) return false
    return true
  })

  const porDiaFaixa = new Map<string, Map<string, string[]>>()

  for (const p of filtrados) {
    const iso = p.data_plantao.slice(0, 10)
    const faixa = faixaTurnoEscala(p.hora_inicio)
    const linha = linhaProfissionalCelula(p, cobertura, modo)

    if (!porDiaFaixa.has(iso)) porDiaFaixa.set(iso, new Map())
    const faixasDia = porDiaFaixa.get(iso)!
    const arr = faixasDia.get(faixa) ?? []
    arr.push(linha)
    faixasDia.set(faixa, arr)
  }

  const primeiroSegunda = addDays(mesIni, -(mesIni.getDay() === 0 ? 6 : mesIni.getDay() - 1))
  const ultimoDomingo = addDays(mesFim, mesFim.getDay() === 0 ? 0 : 7 - mesFim.getDay())
  const dias = eachDayOfInterval({ start: primeiroSegunda, end: ultimoDomingo })

  const semanas: SemanaEscalaPega[] = []

  for (let i = 0; i < dias.length; i += 7) {
    const blocoDias = dias.slice(i, i + 7)
    const isos = blocoDias.map((d) => format(d, 'yyyy-MM-dd'))
    const temDiaNoIntervalo = isos.some((iso) => iso >= dataInicio && iso <= dataFim)
    if (!temDiaNoIntervalo) continue

    const rotulosDias = blocoDias.map((d) => rotuloDiaSemana(format(d, 'yyyy-MM-dd')))

    const faixas: LinhaFaixaEscalaPega[] = FAIXAS_TURNO_ESCALA.map((faixa) => ({
      faixaRotulo: faixa.rotulo,
      dias: isos.map((iso) => {
        const noIntervalo = iso >= dataInicio && iso <= dataFim
        const linhas = noIntervalo
          ? (porDiaFaixa.get(iso)?.get(faixa.id) ?? [])
          : []
        return { linhas }
      }),
    }))

    semanas.push({ rotulosDias, faixas })
  }

  return semanas
}
