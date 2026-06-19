import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

export type TipoRelatorioGerador = 'escala' | 'pagamentos'

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

export const SETORES_OPCOES = [
  'UTI Cardíaca',
  'Pronto-Socorro',
  'Maternidade',
  'Centro Cirúrgico',
  'Enfermaria',
  'Ambulatório',
  'UTI Neonatal',
] as const

export const GRUPOS_OPCOES = [
  'Todos',
  'Plantonistas diurnos',
  'Plantonistas noturnos',
  'Cobertura',
] as const

export const PERIODO_PADRAO = {
  inicio: '2026-06-01',
  fim: '2026-06-30',
} as const

export const LEGENDA_ESCALA =
  'Nome profissional - Afastado por motivos diversos e sem cobertura | Faltas... | CO: Cobertura | FR: Férias'

const MOCK_PAGAMENTOS: LinhaPagamentoProfissional[] = [
  {
    id: 'p1',
    profissionalNome: 'Dra. Ana Paula Mendes',
    telefone: '(91) 98765-1101',
    plantoes: 8,
    duracaoHoras: 96,
    valor: 14800,
  },
  {
    id: 'p2',
    profissionalNome: 'Dr. Felipe Souza',
    telefone: '(91) 98765-2202',
    plantoes: 6,
    duracaoHoras: 72,
    valor: 10920,
  },
  {
    id: 'p3',
    profissionalNome: 'Dra. Juliana Rocha',
    telefone: '(91) 98765-3303',
    plantoes: 4,
    duracaoHoras: 48,
    valor: 7680,
  },
  {
    id: 'p4',
    profissionalNome: 'Dr. Bruno Carvalho',
    telefone: '(91) 98765-4404',
    plantoes: 7,
    duracaoHoras: 84,
    valor: 14700,
  },
  {
    id: 'p5',
    profissionalNome: 'Dra. Camila Nunes',
    telefone: '(91) 98765-5505',
    plantoes: 5,
    duracaoHoras: 60,
    valor: 10250,
  },
  {
    id: 'p6',
    profissionalNome: 'Dr. Rafael Pinto',
    telefone: '(91) 98765-6606',
    plantoes: 9,
    duracaoHoras: 108,
    valor: 17280,
  },
  {
    id: 'p7',
    profissionalNome: 'Dra. Fernanda Lopes',
    telefone: '(91) 98765-7707',
    plantoes: 6,
    duracaoHoras: 72,
    valor: 11880,
  },
]

const ESCALA_JUNHO: Record<string, string[]> = {
  '2026-06-01': ['Ana Paula Mendes', '07h-19h'],
  '2026-06-02': ['Felipe Souza', '19h-07h'],
  '2026-06-03': ['Juliana Rocha', '07h-13h', 'Bruno Carvalho CO', '19h-07h'],
  '2026-06-04': ['Camila Nunes', '07h-19h'],
  '2026-06-05': ['Rafael Pinto', '19h-07h'],
  '2026-06-06': ['Fernanda Lopes FR', '—'],
  '2026-06-07': ['Ana Paula Mendes', '07h-19h'],
  '2026-06-08': ['Felipe Souza', '19h-07h'],
  '2026-06-09': ['Juliana Rocha', '07h-19h'],
  '2026-06-10': ['Bruno Carvalho', '19h-07h'],
  '2026-06-11': ['Camila Nunes CO', 'Rafael Pinto', '07h-19h'],
  '2026-06-12': ['Fernanda Lopes', '19h-07h'],
  '2026-06-13': ['Ana Paula Mendes', '07h-19h'],
  '2026-06-14': ['Felipe Souza', '19h-07h'],
  '2026-06-15': ['Juliana Rocha', '07h-13h'],
  '2026-06-16': ['Bruno Carvalho', '07h-19h'],
  '2026-06-17': ['Camila Nunes', '19h-07h'],
  '2026-06-18': ['Rafael Pinto', '07h-19h'],
  '2026-06-19': ['Fernanda Lopes', '19h-07h'],
  '2026-06-20': ['Ana Paula Mendes FR', '—'],
  '2026-06-21': ['Felipe Souza', '07h-19h'],
  '2026-06-22': ['Juliana Rocha', '19h-07h'],
  '2026-06-23': ['Bruno Carvalho', '07h-19h'],
  '2026-06-24': ['Camila Nunes', '19h-07h'],
  '2026-06-25': ['Rafael Pinto CO', 'Fernanda Lopes', '07h-19h'],
  '2026-06-26': ['Ana Paula Mendes', '19h-07h'],
  '2026-06-27': ['Felipe Souza', '07h-19h'],
  '2026-06-28': ['Juliana Rocha', '19h-07h'],
  '2026-06-29': ['Bruno Carvalho', '07h-19h'],
  '2026-06-30': ['Camila Nunes', '19h-07h'],
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

export function buscarLinhasPagamentos(
  listarTelefone: boolean,
): LinhaPagamentoProfissional[] {
  return MOCK_PAGAMENTOS.map((l) => ({
    ...l,
    telefone: listarTelefone ? l.telefone : '',
  }))
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

/** Grade mensal estilo calendário (7 colunas, semanas completas). */
export function montarGradeEscalaMes(
  dataInicio: string,
  dataFim: string,
): CelulaCalendarioEscala[][] {
  const ref = parseISO(dataInicio)
  const mesIni = startOfMonth(ref)
  const mesFim = endOfMonth(ref)

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
        linhas: noIntervalo ? (ESCALA_JUNHO[iso] ?? []) : [],
      }
    })
    semanas.push(bloco)
  }

  return semanas
}
