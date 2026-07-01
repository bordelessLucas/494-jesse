import { format, isWeekend, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { dataLocalAPartirDeIsoData, formatarHoraDb } from '../escalas/plantoesDb'
import { duracaoHorasPlantao } from '../dashboard/plantaoHoras'

export function fmtPeriodoTilde(dataInicio: string, dataFim: string): string {
  const ini = format(parseISO(dataInicio), 'dd/MM/yyyy')
  const fim = format(parseISO(dataFim), 'dd/MM/yyyy')
  return `${ini}~${fim}`
}

export function fmtDataHoraGeracao(data: Date = new Date()): string {
  const texto = format(data, "dd/MM/yyyy 'às' HH:mm'h'", { locale: ptBR })
  return `${texto} (UTC -3)`
}

export function fmtDataHoraCurta(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return format(d, 'dd/MM/yyyy HH:mm')
}

export function fmtDataPlantaoHora(dataPlantao: string, horaInicio: string): string {
  const data = format(parseISO(dataPlantao.slice(0, 10)), 'dd/MM/yyyy')
  const hora = formatarHoraDb(horaInicio)
  return `${data} ${hora}`
}

export function fmtDiaSemanaCurto(dataPlantao: string): string {
  const d = dataLocalAPartirDeIsoData(dataPlantao)
  const abrev = format(d, 'EEE', { locale: ptBR }).slice(0, 3)
  const cap = abrev.charAt(0).toUpperCase() + abrev.slice(1)
  return `${cap} ${format(d, 'dd/MM/yyyy')}`
}

export function fmtDuracaoHHMM(
  dataPlantao: string,
  horaInicio: string,
  horaFim: string,
): string {
  const horas = duracaoHorasPlantao(dataPlantao, horaInicio, horaFim)
  const h = Math.floor(horas)
  const m = Math.round((horas - h) * 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function fmtDuracaoHorasDecimal(
  dataPlantao: string,
  horaInicio: string,
  horaFim: string,
): string {
  const horas = duracaoHorasPlantao(dataPlantao, horaInicio, horaFim)
  const h = Math.floor(horas)
  const m = Math.round((horas - h) * 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function somarDuracoesHHMM(duracoes: string[]): string {
  let totalMin = 0
  for (const d of duracoes) {
    const [h, m] = d.split(':').map(Number)
    if (Number.isFinite(h) && Number.isFinite(m)) totalMin += h * 60 + m
  }
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function classificarTipoPlantaoRotulo(
  dataPlantao: string,
  horaInicio: string,
): 'Normal' | 'Noturno' | 'Fim de Semana' {
  const d = dataLocalAPartirDeIsoData(dataPlantao)
  if (isWeekend(d)) return 'Fim de Semana'
  const h = parseInt(formatarHoraDb(horaInicio).slice(0, 2), 10)
  if (h >= 19 || h < 7) return 'Noturno'
  return 'Normal'
}

export function fmtBRLPega(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function rotuloLocalSetor(
  localNome: string | null | undefined,
  setorNome: string | null | undefined,
): string {
  const local = localNome?.trim() || ''
  const setor = setorNome?.trim() || ''
  if (local && setor) return `${local} - ${setor}`
  return local || setor || '—'
}

export function abreviarNomePega(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  if (partes.length <= 1) return nome.trim()
  if (partes.length === 2) return `${partes[0]} ${partes[1]}`

  const primeiro = partes[0]
  const ultimo = partes[partes.length - 1]
  const meio = partes
    .slice(1, -1)
    .map((p) => {
      const lower = p.toLowerCase()
      if (['de', 'da', 'do', 'dos', 'das', 'e'].includes(lower)) return lower
      if (p.length <= 3) return p
      return `${p.charAt(0).toUpperCase()}.`
    })
    .join(' ')

  return [primeiro, meio, ultimo].filter(Boolean).join(' ')
}

export function fmtRegistroConselho(
  conselhoNumero: string | null | undefined,
  registroUf: string | null | undefined,
): string {
  const numero = conselhoNumero?.trim()
  const uf = registroUf?.trim()
  if (!numero) return ''
  return uf ? `${numero}/${uf}` : numero
}

export const LEGENDA_ESCALA_PEGA =
  'Nome profissional: Afastado por motivos diversos e sem cobertura FU: Furo FJ: Falta Justificada FN: Falta Não Justificada CO: Cobertura FR: Férias'

export const FAIXAS_TURNO_ESCALA = [
  { id: '07-13', rotulo: '07:00~13:00', inicioMin: 7 * 60, fimMin: 13 * 60 },
  { id: '13-19', rotulo: '13:00~19:00', inicioMin: 13 * 60, fimMin: 19 * 60 },
  { id: '19-07', rotulo: '19:00~07:00', inicioMin: 19 * 60, fimMin: 7 * 60 + 24 * 60 },
] as const

export function faixaTurnoEscala(horaInicio: string): (typeof FAIXAS_TURNO_ESCALA)[number]['id'] {
  const h = parseInt(formatarHoraDb(horaInicio).slice(0, 2), 10)
  if (!Number.isFinite(h)) return '07-13'
  if (h >= 19 || h < 7) return '19-07'
  if (h >= 13) return '13-19'
  return '07-13'
}
