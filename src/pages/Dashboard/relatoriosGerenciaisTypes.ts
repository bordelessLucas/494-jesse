import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfQuarter,
  endOfWeek,
  endOfYear,
  format,
  parseISO,
  startOfMonth,
  startOfQuarter,
  startOfWeek,
  startOfYear,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

export type TipoRelatorioGerador =
  | 'escala'
  | 'pagamentos'
  | 'plantoes'
  | 'trocas_passagens'
  | 'faltas'
  | 'candidaturas'
  | 'locais_setores'

export const TITULOS_RELATORIO_GERENCIAL: Record<TipoRelatorioGerador, string> = {
  escala: 'Escala de Plantões',
  pagamentos: 'Pagamentos para Plantões',
  plantoes: 'Listagem de Plantões',
  trocas_passagens: 'Trocas e Passagens entre Profissionais',
  faltas: 'Listagem de Faltas',
  candidaturas: 'Listagem de Candidaturas',
  locais_setores: 'Locais e Setores',
}

export const RELATORIOS_COM_PERIODO: TipoRelatorioGerador[] = [
  'escala',
  'pagamentos',
  'plantoes',
  'trocas_passagens',
  'faltas',
  'candidaturas',
]

export type LinhaPagamentoProfissional = {
  id: string
  profissionalNome: string
  telefone: string
  plantoes: number
  duracaoHoras: number
  valor: number
}

export type CelulaCalendarioEscala = {
  iso: string
  rotulo: string
  foraMes: boolean
  linhas: string[]
}

export type PlantaoEscalaRow = {
  id: string
  data_plantao: string
  hora_inicio: string
  hora_fim: string
  status: string
  profissional_id: string | null
  setor_id: string
  local_id: string
  profissionais: {
    nome: string
    conselho_numero: string
    telefone: string | null
  } | null
  setores: { nome: string; ativo: boolean } | null
}

export const LEGENDA_ESCALA =
  'Nome profissional: Afastado por motivos diversos e sem cobertura FU: Furo FJ: Falta Justificada FN: Falta Não Justificada CO: Cobertura FR: Férias'

export const GRUPOS_OPCOES = [
  'Todos',
  'Plantonistas diurnos',
  'Plantonistas noturnos',
  'Cobertura',
] as const

export type PeriodoRelatorioPreset =
  | 'semana'
  | 'mes'
  | 'trimestre'
  | 'ano'
  | 'ytd'
  | 'personalizado'

export function periodoPadraoMesAtual(): { inicio: string; fim: string } {
  const agora = new Date()
  return {
    inicio: format(startOfMonth(agora), 'yyyy-MM-dd'),
    fim: format(endOfMonth(agora), 'yyyy-MM-dd'),
  }
}

/** Calcula intervalo conforme preset de período. */
export function intervaloPorPreset(
  preset: PeriodoRelatorioPreset,
  referencia = new Date(),
): { inicio: string; fim: string } {
  switch (preset) {
    case 'semana':
      return {
        inicio: format(startOfWeek(referencia, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
        fim: format(endOfWeek(referencia, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
      }
    case 'trimestre':
      return {
        inicio: format(startOfQuarter(referencia), 'yyyy-MM-dd'),
        fim: format(endOfQuarter(referencia), 'yyyy-MM-dd'),
      }
    case 'ano':
      return {
        inicio: format(startOfYear(referencia), 'yyyy-MM-dd'),
        fim: format(endOfYear(referencia), 'yyyy-MM-dd'),
      }
    case 'ytd':
      return {
        inicio: format(startOfYear(referencia), 'yyyy-MM-dd'),
        fim: format(referencia, 'yyyy-MM-dd'),
      }
    case 'mes':
    default:
      return {
        inicio: format(startOfMonth(referencia), 'yyyy-MM-dd'),
        fim: format(endOfMonth(referencia), 'yyyy-MM-dd'),
      }
  }
}

export type FiltroRelatorioEscala = {
  localId?: string
  setorIds?: string[]
  dataInicio: string
  dataFim: string
  competencia: string
  tipo: 'Mensal' | 'Semanal' | 'Quinzenal'
  tipoTurno?: 'Todos' | 'Diurno' | 'Noturno' | '24h'
  identificarProfissional?: 'Nome completo' | 'Nome abreviado' | 'CRM'
  incluirSetoresInativos?: boolean
}

function rotuloDiaCalendario(iso: string): string {
  const d = parseISO(iso)
  const abrev = format(d, 'EEE', { locale: ptBR }).slice(0, 3).toUpperCase()
  return `${abrev} ${format(d, 'dd/MM')}`
}

export function fmtPeriodo(dataInicio: string, dataFim: string): string {
  const ini = format(parseISO(dataInicio), 'dd/MM/yyyy')
  const fim = format(parseISO(dataFim), 'dd/MM/yyyy')
  return `${ini} - ${fim}`
}

export function fmtBRL(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function totaisPagamentos(linhas: LinhaPagamentoProfissional[]) {
  return linhas.reduce(
    (acc, l) => {
      acc.plantoes += l.plantoes
      acc.horas += l.duracaoHoras
      acc.valor += l.valor
      return acc
    },
    { plantoes: 0, horas: 0, valor: 0 },
  )
}

export function competenciaDeData(iso: string): string {
  return iso.slice(0, 7)
}

export function formatarHoraRelatorio(hora: string): string {
  const h = String(hora).slice(0, 5)
  return `${h.slice(0, 2)}h-${h.slice(3, 5)}h`
}

export function rotuloProfissionalPlantao(
  row: PlantaoEscalaRow,
  modo: FiltroRelatorioEscala['identificarProfissional'],
): string {
  if (!row.profissionais) return '—'
  const { nome, conselho_numero: crm } = row.profissionais
  switch (modo) {
    case 'CRM':
      return crm?.trim() || nome
    case 'Nome abreviado': {
      const partes = nome.trim().split(/\s+/).filter(Boolean)
      if (partes.length <= 1) return nome
      return `${partes[0]} ${partes[partes.length - 1]}`
    }
    default:
      return nome
  }
}

function plantaoPassaFiltroTurno(
  horaInicio: string,
  tipoTurno: FiltroRelatorioEscala['tipoTurno'],
): boolean {
  if (!tipoTurno || tipoTurno === 'Todos') return true
  const h = parseInt(String(horaInicio).slice(0, 2), 10)
  if (!Number.isFinite(h)) return true
  switch (tipoTurno) {
    case 'Diurno':
      return h >= 6 && h < 19
    case 'Noturno':
      return h >= 19 || h < 6
    case '24h':
      return true
    default:
      return true
  }
}

/** Monta linha textual exibida na célula do calendário. */
export function linhaTextoPlantaoEscala(
  row: PlantaoEscalaRow,
  modo: FiltroRelatorioEscala['identificarProfissional'],
): string {
  const rotulo = rotuloProfissionalPlantao(row, modo)
  const horario = formatarHoraRelatorio(row.hora_inicio)
  if (row.status === 'vago') return `Vago ${horario}`
  if (row.status === 'pendente_troca') return `${rotulo} (troca) ${horario}`
  return `${rotulo} ${horario}`
}

/** Grade mensal estilo calendário (7 colunas, semanas completas). */
export function montarGradeEscalaMes(
  dataInicio: string,
  dataFim: string,
  plantoes: PlantaoEscalaRow[],
  opcoes?: {
    identificarProfissional?: FiltroRelatorioEscala['identificarProfissional']
    tipoTurno?: FiltroRelatorioEscala['tipoTurno']
    setorIds?: string[]
    incluirSetoresInativos?: boolean
  },
): CelulaCalendarioEscala[][] {
  const ref = parseISO(dataInicio)
  const mesIni = startOfMonth(ref)
  const mesFim = endOfMonth(ref)

  const setorIds = opcoes?.setorIds ?? []
  const filtrados = plantoes.filter((p) => {
    if (setorIds.length > 0 && !setorIds.includes(p.setor_id)) return false
    if (!opcoes?.incluirSetoresInativos && p.setores?.ativo === false) return false
    if (!plantaoPassaFiltroTurno(p.hora_inicio, opcoes?.tipoTurno)) return false
    return true
  })

  const porDia = new Map<string, string[]>()
  for (const p of filtrados) {
    const iso = p.data_plantao.slice(0, 10)
    const linha = linhaTextoPlantaoEscala(p, opcoes?.identificarProfissional)
    const arr = porDia.get(iso) ?? []
    arr.push(linha)
    porDia.set(iso, arr)
  }

  const primeiroSegunda = addDays(mesIni, -(mesIni.getDay() === 0 ? 6 : mesIni.getDay() - 1))
  const ultimoDomingo = addDays(mesFim, mesFim.getDay() === 0 ? 0 : 7 - mesFim.getDay())

  const dias = eachDayOfInterval({ start: primeiroSegunda, end: ultimoDomingo })
  const semanas: CelulaCalendarioEscala[][] = []

  for (let i = 0; i < dias.length; i += 7) {
    const bloco = dias.slice(i, i + 7).map((d) => {
      const iso = format(d, 'yyyy-MM-dd')
      const noMes = d >= mesIni && d <= mesFim
      const noIntervalo = iso >= dataInicio && iso <= dataFim
      return {
        iso,
        rotulo: rotuloDiaCalendario(iso),
        foraMes: !noMes,
        linhas: noIntervalo ? (porDia.get(iso) ?? []) : [],
      }
    })
    semanas.push(bloco)
  }

  return semanas
}

export function rankingParaLinhasPagamento(
  rows: {
    profissional_id: string
    nome: string
    horas: number
    plantoes: number
    valor_total: number
  }[],
  telefones: Map<string, string>,
  listarTelefone: boolean,
): LinhaPagamentoProfissional[] {
  return rows.map((r) => ({
    id: r.profissional_id,
    profissionalNome: r.nome,
    telefone: listarTelefone ? (telefones.get(r.profissional_id) ?? '') : '',
    plantoes: Number(r.plantoes),
    duracaoHoras: Math.round(Number(r.horas)),
    valor: Number(r.valor_total),
  }))
}
