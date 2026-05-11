import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  CalendarRange,
  ChevronDown,
  FileDown,
  FileSpreadsheet,
  X,
} from 'lucide-react'

import { cn } from '../../lib/cn'
import { RelatorioGerencialImpressaoModal } from '../../features/relatorios/RelatorioGerencialImpressaoModal'

const SELECT_CLASS =
  'min-w-0 w-full rounded-md border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm text-slate-700 shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'

export type RelatorioTipoId =
  | 'tolerancia'
  | 'financeiro_entrada_saida_tol_consolidado'
  | 'financeiro_entrada_saida_consolidado'
  | 'financeiro_sintetico'
  | 'financeiro_valor_hora'
  | 'grupos_usuarios'
  | 'habilidades'
  | 'horas_trabalhadas'
  | 'justificativas_entrada_saida'
  | 'livro_presenca'
  | 'locais_setores'
  | 'plantoes'

const TIPOS_RELATORIO: {
  id: RelatorioTipoId
  label: string
  resumoPlaceholder: string
}[] = [
  {
    id: 'tolerancia',
    label: 'Tolerância',
    resumoPlaceholder:
      'Consolidação de tolerâncias aplicadas aos registros de ponto e impacto nos totais.',
  },
  {
    id: 'financeiro_entrada_saida_tol_consolidado',
    label: 'Financeiro Entrada/Saída c/ Tolerância Consolidado',
    resumoPlaceholder:
      'Movimentação financeira com tolerância agregada por período e unidade.',
  },
  {
    id: 'financeiro_entrada_saida_consolidado',
    label: 'Financeiro Entrada/Saída Consolidado',
    resumoPlaceholder:
      'Entradas e saídas financeiras consolidadas sem camada de tolerância.',
  },
  {
    id: 'financeiro_sintetico',
    label: 'Financeiro Sintético',
    resumoPlaceholder:
      'Visão sintética de valores, totais e indicadores financeiros do plantão.',
  },
  {
    id: 'financeiro_valor_hora',
    label: 'Financeiro Valor por Hora',
    resumoPlaceholder:
      'Apuração de valores por hora trabalhada, turno e tipo de plantão.',
  },
  {
    id: 'grupos_usuarios',
    label: 'Grupos dos Usuários',
    resumoPlaceholder:
      'Distribuição de profissionais por grupos de escala e permissões.',
  },
  {
    id: 'habilidades',
    label: 'Habilidades',
    resumoPlaceholder:
      'Habilidades cadastradas x profissionais habilitados por local.',
  },
  {
    id: 'horas_trabalhadas',
    label: 'Horas Trabalhadas',
    resumoPlaceholder:
      'Totalização de horas por profissional, setor e intervalo de datas.',
  },
  {
    id: 'justificativas_entrada_saida',
    label: 'Justificativas dos registros de Entrada / Saída',
    resumoPlaceholder:
      'Registros de batida com justificativa, aprovador e status.',
  },
  {
    id: 'livro_presenca',
    label: 'Livro de Presença',
    resumoPlaceholder:
      'Livro de presença formal com assinaturas e sequência cronológica.',
  },
  {
    id: 'locais_setores',
    label: 'Locais e Setores',
    resumoPlaceholder:
      'Cadastro e uso de locais e setores nas escalas e batidas.',
  },
  {
    id: 'plantoes',
    label: 'Plantões',
    resumoPlaceholder: '',
  },
]

function RelatorioTipoPicker({
  value,
  onChange,
}: {
  value: RelatorioTipoId
  onChange: (id: RelatorioTipoId) => void
}) {
  const [aberto, setAberto] = useState(false)
  const [busca, setBusca] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)

  const atual = TIPOS_RELATORIO.find((t) => t.id === value) ?? TIPOS_RELATORIO[11]

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return TIPOS_RELATORIO
    return TIPOS_RELATORIO.filter((t) => t.label.toLowerCase().includes(q))
  }, [busca])

  useEffect(() => {
    if (!aberto) return
    function fora(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setAberto(false)
    }
    document.addEventListener('mousedown', fora)
    return () => document.removeEventListener('mousedown', fora)
  }, [aberto])

  return (
    <div ref={rootRef} className="relative w-full max-w-xl">
      <p className="mb-1.5 text-xs text-slate-500">Relatório</p>
      <button
        type="button"
        id="relatorio-tipo-trigger"
        aria-haspopup="listbox"
        aria-expanded={aberto}
        onClick={() => setAberto((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-3 py-2.5 text-left text-sm font-medium text-slate-800 shadow-sm outline-none transition-colors hover:border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20"
      >
        <span className="min-w-0 truncate">{atual.label}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-slate-500 transition-transform',
            aberto && 'rotate-180',
          )}
          strokeWidth={2}
          aria-hidden
        />
      </button>

      {aberto && (
        <div
          className="absolute left-0 right-0 z-30 mt-1 max-h-[min(22rem,calc(100dvh-12rem))] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
          role="listbox"
          aria-labelledby="relatorio-tipo-trigger"
        >
          <div className="border-b border-slate-100 p-2">
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar relatório…"
              autoFocus
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <ul className="max-h-52 overflow-y-auto py-1">
            {filtrados.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-slate-500">
                Nenhum relatório encontrado.
              </li>
            ) : (
              filtrados.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={t.id === value}
                    onClick={() => {
                      onChange(t.id)
                      setAberto(false)
                      setBusca('')
                    }}
                    className={cn(
                      'flex w-full px-3 py-2 text-left text-sm transition-colors',
                      t.id === value
                        ? 'bg-primary-600 font-medium text-white'
                        : 'text-slate-800 hover:bg-slate-50',
                    )}
                  >
                    <span className="min-w-0">{t.label}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

export type StatusPagamentoPlantao = 'pago' | 'pendente' | 'glosado'

export type TipoPlantaoRelatorio = 'normal' | 'substituicao'

export interface PlantaoRelatorioLinha {
  id: string
  data: string
  horas: number
  profissionalNome: string
  especialidade: string
  localNome: string
  setorNome: string
  turno: string
  tipo: TipoPlantaoRelatorio
  valor: number
  status: StatusPagamentoPlantao
  detalhes: {
    autorizadoPor: string
    checkIn: string
    checkOut: string
    observacoes: string
  }
}

const LOCAIS_OPCOES = [
  { value: '', label: 'Todos os locais' },
  { value: 'amazonia', label: 'Hospital Amazônia' },
  { value: 'ps', label: 'Pronto Socorro Central' },
  { value: 'norte', label: 'Hospital Regional Norte' },
  { value: 'clinica', label: 'Clínica São Lucas' },
] as const

const MOCK_PLANTOES: PlantaoRelatorioLinha[] = [
  {
    id: '1',
    data: '2026-05-02',
    horas: 12,
    profissionalNome: 'Dra. Ana Paula Ferreira',
    especialidade: 'Cardiologia',
    localNome: 'Hospital Amazônia',
    setorNome: 'UTI Cardio',
    turno: 'Diurno · 07h–19h',
    tipo: 'normal',
    valor: 2400,
    status: 'pago',
    detalhes: {
      autorizadoPor: 'Coord. Enf. Ricardo Souza',
      checkIn: '06:58 — biométrico',
      checkOut: '19:02 — biométrico',
      observacoes: 'Plantão sem intercorrências.',
    },
  },
  {
    id: '2',
    data: '2026-05-03',
    horas: 12,
    profissionalNome: 'Dr. Carlos Mendes Silva',
    especialidade: 'Clínica Médica',
    localNome: 'Pronto Socorro Central',
    setorNome: 'Sala Vermelha',
    turno: 'Noturno · 19h–07h',
    tipo: 'substituicao',
    valor: 2800,
    status: 'pendente',
    detalhes: {
      autorizadoPor: 'Dr. Felipe Amaral (troca aprovada)',
      checkIn: '18:55 — app PlantãoCheck',
      checkOut: '07:08 — app PlantãoCheck',
      observacoes: 'Substituição por falta médica; aguardando faturamento.',
    },
  },
  {
    id: '3',
    data: '2026-05-04',
    horas: 6,
    profissionalNome: 'Enf. Mariana Costa',
    especialidade: 'Enfermagem Intensiva',
    localNome: 'Hospital Regional Norte',
    setorNome: 'UTI Pediátrica',
    turno: 'Diurno · 07h–13h',
    tipo: 'normal',
    valor: 980,
    status: 'pago',
    detalhes: {
      autorizadoPor: 'Coord. Médica Dra. Lúcia Prado',
      checkIn: '06:59 — biométrico',
      checkOut: '13:01 — biométrico',
      observacoes: '',
    },
  },
  {
    id: '4',
    data: '2026-05-05',
    horas: 12,
    profissionalNome: 'Dr. Roberto Lima',
    especialidade: 'Neurologia',
    localNome: 'Hospital Amazônia',
    setorNome: 'Enfermaria Neurologia',
    turno: 'Diurno · 07h–19h',
    tipo: 'normal',
    valor: 2200,
    status: 'glosado',
    detalhes: {
      autorizadoPor: 'Gestão de Escalas — automático',
      checkIn: '— (não registrado)',
      checkOut: '19:00 — manual',
      observacoes: 'Glosa: divergência de assinatura digital no fechamento.',
    },
  },
  {
    id: '5',
    data: '2026-05-06',
    horas: 12,
    profissionalNome: 'Dra. Juliana Rocha',
    especialidade: 'Pediatria',
    localNome: 'Clínica São Lucas',
    setorNome: 'Ambulatório',
    turno: 'Diurno · 08h–20h',
    tipo: 'normal',
    valor: 1800,
    status: 'pendente',
    detalhes: {
      autorizadoPor: 'Recepção — Dr. Otávio Nunes',
      checkIn: '07:52 — QR Code',
      checkOut: '20:05 — QR Code',
      observacoes: 'Aguardando NF do profissional.',
    },
  },
  {
    id: '6',
    data: '2026-05-07',
    horas: 6,
    profissionalNome: 'Dr. Paulo Henrique Alves',
    especialidade: 'Ortopedia',
    localNome: 'Pronto Socorro Central',
    setorNome: 'Ortopedia',
    turno: 'Noturno · 01h–07h',
    tipo: 'substituicao',
    valor: 1500,
    status: 'pago',
    detalhes: {
      autorizadoPor: 'Coord. Plantão Noturno',
      checkIn: '00:58',
      checkOut: '07:02',
      observacoes: 'Cobertura de plantão extra.',
    },
  },
  {
    id: '7',
    data: '2026-05-08',
    horas: 12,
    profissionalNome: 'Enf. Fernanda Duarte',
    especialidade: 'UTI Adulto',
    localNome: 'Hospital Regional Norte',
    setorNome: 'UTI Adulto',
    turno: 'Diurno · 07h–19h',
    tipo: 'normal',
    valor: 1100,
    status: 'pago',
    detalhes: {
      autorizadoPor: 'Enf. Coord. Patrícia Melo',
      checkIn: '06:55',
      checkOut: '19:00',
      observacoes: '',
    },
  },
  {
    id: '8',
    data: '2026-05-09',
    horas: 12,
    profissionalNome: 'Dr. Lucas Vieira',
    especialidade: 'Emergência',
    localNome: 'Hospital Amazônia',
    setorNome: 'PS Adulto',
    turno: 'Noturno · 19h–07h',
    tipo: 'normal',
    valor: 2600,
    status: 'pendente',
    detalhes: {
      autorizadoPor: 'Sistema — escala publicada',
      checkIn: '18:50',
      checkOut: '07:05',
      observacoes: 'Repasse financeiro pendente (ciclo quinzenal).',
    },
  },
  {
    id: '9',
    data: '2026-05-10',
    horas: 6,
    profissionalNome: 'Dra. Camila Nogueira',
    especialidade: 'Medicina do Trabalho',
    localNome: 'Clínica São Lucas',
    setorNome: 'Perícias',
    turno: 'Tarde · 13h–19h',
    tipo: 'normal',
    valor: 900,
    status: 'pago',
    detalhes: {
      autorizadoPor: 'Dr. Gustavo Meireles',
      checkIn: '12:58',
      checkOut: '19:10',
      observacoes: '',
    },
  },
  {
    id: '10',
    data: '2026-05-11',
    horas: 12,
    profissionalNome: 'Dr. André Freitas',
    especialidade: 'Anestesiologia',
    localNome: 'Hospital Amazônia',
    setorNome: 'Centro Cirúrgico',
    turno: 'Diurno · 07h–19h',
    tipo: 'substituicao',
    valor: 3200,
    status: 'glosado',
    detalhes: {
      autorizadoPor: 'CC — anestesia plantão',
      checkIn: '07:00',
      checkOut: '—',
      observacoes: 'Glosa: check-out não batido; em recurso.',
    },
  },
  {
    id: '11',
    data: '2026-05-12',
    horas: 12,
    profissionalNome: 'Dra. Ana Paula Ferreira',
    especialidade: 'Cardiologia',
    localNome: 'Hospital Amazônia',
    setorNome: 'UTI Cardio',
    turno: 'Diurno · 07h–19h',
    tipo: 'normal',
    valor: 2400,
    status: 'pendente',
    detalhes: {
      autorizadoPor: 'Coord. Enf. Ricardo Souza',
      checkIn: '06:57',
      checkOut: '19:00',
      observacoes: 'Processamento em lote semanal.',
    },
  },
  {
    id: '12',
    data: '2026-05-13',
    horas: 6,
    profissionalNome: 'Dr. Carlos Mendes Silva',
    especialidade: 'Clínica Médica',
    localNome: 'Pronto Socorro Central',
    setorNome: 'Observação',
    turno: 'Diurno · 13h–19h',
    tipo: 'normal',
    valor: 1200,
    status: 'pago',
    detalhes: {
      autorizadoPor: 'Enf. Supervisora Carla Dias',
      checkIn: '12:55',
      checkOut: '19:02',
      observacoes: '',
    },
  },
]

const LOCAL_VALUE_TO_NOME: Record<string, string> = {
  amazonia: 'Hospital Amazônia',
  ps: 'Pronto Socorro Central',
  norte: 'Hospital Regional Norte',
  clinica: 'Clínica São Lucas',
}

function inicioSemanaISO(d: Date) {
  const copy = new Date(d)
  const day = copy.getDay()
  const diff = copy.getDate() - day + (day === 0 ? -6 : 1)
  copy.setDate(diff)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function parseDataBR(iso: string) {
  const [y, m, day] = iso.split('-').map(Number)
  return new Date(y, m - 1, day)
}

function formatarMoeda(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function statusBadgeClasses(status: StatusPagamentoPlantao) {
  switch (status) {
    case 'pago':
      return 'bg-success-100 text-success-800 ring-1 ring-success-600/20'
    case 'pendente':
      return 'bg-warning-100 text-warning-800 ring-1 ring-warning-600/25'
    case 'glosado':
      return 'bg-danger-100 text-danger-800 ring-1 ring-danger-600/20'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}

function statusLabel(status: StatusPagamentoPlantao) {
  switch (status) {
    case 'pago':
      return 'Pago'
    case 'pendente':
      return 'Pendente'
    case 'glosado':
      return 'Glosado'
    default:
      return status
  }
}

function filtrarPlantoes(
  origem: PlantaoRelatorioLinha[],
  filtros: {
    local: string
    profissionalBusca: string
    status: '' | StatusPagamentoPlantao
    dataInicio: string
    dataFim: string
  },
) {
  const inicio = parseDataBR(filtros.dataInicio)
  const fim = parseDataBR(filtros.dataFim)
  fim.setHours(23, 59, 59, 999)

  const nomeLocalFiltro = filtros.local
    ? LOCAL_VALUE_TO_NOME[filtros.local] ?? ''
    : ''

  const busca = filtros.profissionalBusca.trim().toLowerCase()

  return origem.filter((row) => {
    const t = parseDataBR(row.data).getTime()
    if (t < inicio.getTime() || t > fim.getTime()) return false
    if (nomeLocalFiltro && row.localNome !== nomeLocalFiltro) return false
    if (filtros.status && row.status !== filtros.status) return false
    if (busca) {
      const blob = `${row.profissionalNome} ${row.especialidade}`.toLowerCase()
      if (!blob.includes(busca)) return false
    }
    return true
  })
}

function plantoesNaSemanaCorrente(origem: PlantaoRelatorioLinha[]) {
  const hoje = new Date(2026, 4, 11)
  const ini = inicioSemanaISO(hoje)
  const fim = new Date(ini)
  fim.setDate(fim.getDate() + 6)
  fim.setHours(23, 59, 59, 999)

  return origem.filter((row) => {
    const t = parseDataBR(row.data).getTime()
    return t >= ini.getTime() && t <= fim.getTime()
  }).length
}

function exportarCsv(linhas: PlantaoRelatorioLinha[]) {
  const header = [
    'Data',
    'Profissional',
    'Especialidade',
    'Local',
    'Setor',
    'Turno',
    'Tipo',
    'Valor',
    'Status',
    'Horas',
  ]
  const rows = linhas.map((r) =>
    [
      r.data,
      r.profissionalNome,
      r.especialidade,
      r.localNome,
      r.setorNome,
      r.turno,
      r.tipo === 'substituicao' ? 'Substituição/Troca' : 'Normal',
      String(r.valor).replace('.', ','),
      statusLabel(r.status),
      String(r.horas),
    ]
      .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
      .join(';'),
  )
  const csv = [header.join(';'), ...rows].join('\n')
  const blob = new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `relatorio-plantoes-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function RelatoriosPage() {
  const [tipoRelatorio, setTipoRelatorio] =
    useState<RelatorioTipoId>('plantoes')

  const [filtrosForm, setFiltrosForm] = useState({
    dataInicio: '2026-05-01',
    dataFim: '2026-05-31',
    local: '',
    profissionalBusca: '',
    status: '' as '' | StatusPagamentoPlantao,
  })

  const [filtrosAplicados, setFiltrosAplicados] = useState(filtrosForm)

  const [linhaDetalhe, setLinhaDetalhe] = useState<PlantaoRelatorioLinha | null>(
    null,
  )

  const relatorioPlantoes = tipoRelatorio === 'plantoes'

  const [impressaoGerencialAberta, setImpressaoGerencialAberta] =
    useState(false)

  useEffect(() => {
    setLinhaDetalhe(null)
    setImpressaoGerencialAberta(false)
  }, [tipoRelatorio])

  const metaTipoAtual = useMemo(
    () => TIPOS_RELATORIO.find((t) => t.id === tipoRelatorio),
    [tipoRelatorio],
  )

  const dadosFiltrados = useMemo(
    () => filtrarPlantoes(MOCK_PLANTOES, filtrosAplicados),
    [filtrosAplicados],
  )

  const plantoesSemana = useMemo(
    () => plantoesNaSemanaCorrente(MOCK_PLANTOES),
    [],
  )

  const totais = useMemo(() => {
    const totalHoras = dadosFiltrados.reduce((acc, r) => acc + r.horas, 0)
    const valorBruto = dadosFiltrados.reduce((acc, r) => acc + r.valor, 0)
    const valorPendente = dadosFiltrados
      .filter((r) => r.status === 'pendente')
      .reduce((acc, r) => acc + r.valor, 0)
    return {
      totalPlantoes: dadosFiltrados.length,
      totalHoras,
      valorBruto,
      valorPendente,
    }
  }, [dadosFiltrados])

  const periodoLabel = useMemo(() => {
    const fmt = (iso: string) => {
      const d = parseDataBR(iso)
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    }
    return `${fmt(filtrosForm.dataInicio)} a ${fmt(filtrosForm.dataFim)}`
  }, [filtrosForm.dataInicio, filtrosForm.dataFim])

  const periodoAplicadoLabel = useMemo(() => {
    const fmt = (iso: string) => {
      const d = parseDataBR(iso)
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    }
    return `${fmt(filtrosAplicados.dataInicio)} a ${fmt(
      filtrosAplicados.dataFim,
    )}`
  }, [filtrosAplicados.dataInicio, filtrosAplicados.dataFim])

  const aplicarFiltros = useCallback(() => {
    setFiltrosAplicados({ ...filtrosForm })
  }, [filtrosForm])

  const limparFiltros = useCallback(() => {
    const reset = {
      dataInicio: '2026-05-01',
      dataFim: '2026-05-31',
      local: '',
      profissionalBusca: '',
      status: '' as const,
    }
    setFiltrosForm(reset)
    setFiltrosAplicados(reset)
  }, [])

  const exportarExcel = useCallback(() => {
    if (!relatorioPlantoes) return
    exportarCsv(dadosFiltrados)
  }, [dadosFiltrados, relatorioPlantoes])

  const exportarPdf = useCallback(() => {
    if (!relatorioPlantoes) return
    setImpressaoGerencialAberta(true)
  }, [relatorioPlantoes])

  return (
    <div className="relative mx-auto w-full max-w-7xl pb-16">
      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Relatórios
            </h1>
            {relatorioPlantoes ? (
              <span className="inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-800 ring-1 ring-primary-600/15">
                Plantões nesta semana: {plantoesSemana}
              </span>
            ) : (
              <span className="inline-flex max-w-full items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                <span className="truncate">{metaTipoAtual?.label}</span>
              </span>
            )}
            <span className="text-sm text-slate-500">
              Visão gerencial e financeira (dados de demonstração)
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={exportarExcel}
            disabled={!relatorioPlantoes}
            title={
              relatorioPlantoes
                ? undefined
                : 'Exportação disponível para o relatório Plantões.'
            }
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-45"
          >
            <FileSpreadsheet className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            Exportar Excel
          </button>
          <button
            type="button"
            onClick={exportarPdf}
            disabled={!relatorioPlantoes}
            title={
              relatorioPlantoes
                ? undefined
                : 'Exportação disponível para o relatório Plantões.'
            }
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-45"
          >
            <FileDown className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            Exportar PDF
          </button>
        </div>
      </header>

      <section className="mb-6 rounded-xl bg-white p-4 shadow-sm print:hidden">
        <RelatorioTipoPicker value={tipoRelatorio} onChange={setTipoRelatorio} />

        {relatorioPlantoes ? (
          <>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Período
            </label>
            <div className="flex min-h-10.5 cursor-default items-center gap-2 rounded-md border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-800 shadow-sm">
              <CalendarRange
                className="h-4 w-4 shrink-0 text-primary-600"
                strokeWidth={1.75}
                aria-hidden
              />
              <span className="tabular-nums">{periodoLabel}</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Ajuste o intervalo pelos filtros internos (simulação).
            </p>
          </div>

          <div>
            <label
              htmlFor="rel-local"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Local
            </label>
            <select
              id="rel-local"
              className={SELECT_CLASS}
              value={filtrosForm.local}
              onChange={(e) =>
                setFiltrosForm((s) => ({ ...s, local: e.target.value }))
              }
            >
              {LOCAIS_OPCOES.map((o) => (
                <option key={o.value || 'all'} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="rel-prof"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Profissional / Especialidade
            </label>
            <input
              id="rel-prof"
              type="search"
              placeholder="Buscar por nome ou especialidade…"
              value={filtrosForm.profissionalBusca}
              onChange={(e) =>
                setFiltrosForm((s) => ({
                  ...s,
                  profissionalBusca: e.target.value,
                }))
              }
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label
              htmlFor="rel-status"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Status
            </label>
            <select
              id="rel-status"
              className={SELECT_CLASS}
              value={filtrosForm.status}
              onChange={(e) =>
                setFiltrosForm((s) => ({
                  ...s,
                  status: e.target.value as '' | StatusPagamentoPlantao,
                }))
              }
            >
              <option value="">Todos</option>
              <option value="pago">Pagos</option>
              <option value="pendente">Pendentes</option>
              <option value="glosado">Glosados</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          <div className="flex flex-wrap gap-2 md:contents">
            <label className="sr-only" htmlFor="rel-di">
              Data início
            </label>
            <input
              id="rel-di"
              type="date"
              value={filtrosForm.dataInicio}
              onChange={(e) =>
                setFiltrosForm((s) => ({ ...s, dataInicio: e.target.value }))
              }
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <label className="sr-only" htmlFor="rel-df">
              Data fim
            </label>
            <input
              id="rel-df"
              type="date"
              value={filtrosForm.dataFim}
              onChange={(e) =>
                setFiltrosForm((s) => ({ ...s, dataFim: e.target.value }))
              }
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button
            type="button"
            onClick={aplicarFiltros}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Aplicar filtros
          </button>
          <button
            type="button"
            onClick={limparFiltros}
            className="inline-flex items-center justify-center rounded-lg border border-transparent px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Limpar
          </button>
        </div>
          </>
        ) : (
          <p className="mt-4 text-sm text-slate-600">
            Os filtros específicos deste modelo aparecerão aqui quando o relatório
            for conectado aos dados.
          </p>
        )}
      </section>

      {relatorioPlantoes ? (
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-240 border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th
                  scope="col"
                  className="px-3 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-600"
                >
                  Data
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-600"
                >
                  Profissional
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-600"
                >
                  Local
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-600"
                >
                  Turno
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-600"
                >
                  Tipo
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-600"
                >
                  Valor
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-600"
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {dadosFiltrados.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-3 py-12 text-center text-sm text-slate-500"
                  >
                    Nenhum plantão encontrado com os filtros atuais.
                  </td>
                </tr>
              ) : (
                dadosFiltrados.map((row) => (
                  <tr
                    key={row.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setLinhaDetalhe(row)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setLinhaDetalhe(row)
                      }
                    }}
                    className="cursor-pointer border-b border-slate-200 transition-colors last:border-b-0 hover:bg-slate-50/80 focus-visible:bg-slate-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
                  >
                    <td className="px-3 py-4 align-middle tabular-nums text-slate-700">
                      {parseDataBR(row.data).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-3 py-4 align-middle">
                      <p className="font-medium text-slate-900">
                        {row.profissionalNome}
                      </p>
                      <p className="text-xs text-slate-500">{row.especialidade}</p>
                    </td>
                    <td className="px-3 py-4 align-middle">
                      <div className="flex flex-wrap gap-1.5">
                        <span className="inline-block max-w-full rounded px-2 py-0.5 text-xs font-medium text-orange-950 bg-orange-200/90">
                          {row.localNome}
                        </span>
                        <span className="inline-block max-w-full rounded px-2 py-0.5 text-xs font-medium text-teal-950 bg-teal-200/90">
                          {row.setorNome}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-4 align-middle text-slate-600">
                      {row.turno}
                    </td>
                    <td className="px-3 py-4 align-middle">
                      <span
                        className={cn(
                          'inline-flex rounded-md px-2 py-0.5 text-xs font-medium',
                          row.tipo === 'substituicao'
                            ? 'bg-primary-100 text-primary-900'
                            : 'bg-slate-100 text-slate-700',
                        )}
                      >
                        {row.tipo === 'substituicao'
                          ? 'Substituição / Troca'
                          : 'Plantão normal'}
                      </span>
                    </td>
                    <td className="px-3 py-4 align-middle text-right font-medium tabular-nums text-slate-900">
                      {formatarMoeda(row.valor)}
                    </td>
                    <td className="px-3 py-4 align-middle">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold',
                          statusBadgeClasses(row.status),
                        )}
                      >
                        {statusLabel(row.status)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {dadosFiltrados.length > 0 && (
          <div className="border-t border-slate-200 bg-slate-100 px-4 py-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Agregação financeira (filtro atual)
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs font-medium text-slate-600">
                  Total de plantões / horas
                </p>
                <p className="mt-1 text-lg font-bold tabular-nums text-slate-900">
                  {totais.totalPlantoes}{' '}
                  <span className="text-base font-semibold text-slate-600">
                    · {totais.totalHoras} h
                  </span>
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-600">
                  Valor total bruto
                </p>
                <p className="mt-1 text-lg font-bold tabular-nums text-slate-900">
                  {formatarMoeda(totais.valorBruto)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-600">
                  Valor pendente de repasse
                </p>
                <p className="mt-1 text-lg font-bold tabular-nums text-warning-800">
                  {formatarMoeda(totais.valorPendente)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      ) : (
        <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm print:hidden">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            {metaTipoAtual?.label}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            {metaTipoAtual?.resumoPlaceholder}
          </p>
          <p className="mt-6 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Este tipo de relatório terá grade, totais e exportação próprios. A
            estrutura de dados e consultas serão ligadas ao Supabase em uma próxima
            etapa.
          </p>
        </section>
      )}

      {relatorioPlantoes && (
      <p className="mt-3 text-xs text-slate-500 print:hidden">
        Dica: toque em uma linha para ver autorização da escala, check-in/out e
        observações.
      </p>
      )}

      {/* Slide-over detalhes */}
      <div
        className={cn(
          'fixed inset-0 z-50 transition-[visibility] print:hidden',
          linhaDetalhe ? 'visible' : 'invisible pointer-events-none',
        )}
        aria-hidden={!linhaDetalhe}
      >
        <button
          type="button"
          tabIndex={linhaDetalhe ? 0 : -1}
          className={cn(
            'absolute inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity',
            linhaDetalhe ? 'opacity-100' : 'opacity-0',
          )}
          onClick={() => setLinhaDetalhe(null)}
          aria-label="Fechar painel de detalhes"
        />

        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="rel-detalhe-titulo"
          className={cn(
            'fixed inset-y-0 right-0 flex h-full w-full max-w-md flex-col bg-white shadow-xl transition-transform duration-300 ease-out',
            linhaDetalhe ? 'translate-x-0' : 'translate-x-full',
          )}
        >
          <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
            <div>
              <h2
                id="rel-detalhe-titulo"
                className="text-lg font-semibold tracking-tight text-slate-900"
              >
                Detalhe do plantão
              </h2>
              {linhaDetalhe && (
                <p className="mt-1 text-sm text-slate-500">
                  {parseDataBR(linhaDetalhe.data).toLocaleDateString('pt-BR')} ·{' '}
                  {linhaDetalhe.turno}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setLinhaDetalhe(null)}
              className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </header>

          {linhaDetalhe && (
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Profissional
                  </dt>
                  <dd className="mt-1 font-medium text-slate-900">
                    {linhaDetalhe.profissionalNome}
                  </dd>
                  <dd className="text-slate-600">{linhaDetalhe.especialidade}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Local / setor
                  </dt>
                  <dd className="mt-1 flex flex-wrap gap-1.5">
                    <span className="rounded px-2 py-0.5 text-xs font-medium text-orange-950 bg-orange-200/90">
                      {linhaDetalhe.localNome}
                    </span>
                    <span className="rounded px-2 py-0.5 text-xs font-medium text-teal-950 bg-teal-200/90">
                      {linhaDetalhe.setorNome}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Valor e status
                  </dt>
                  <dd className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="font-semibold tabular-nums text-slate-900">
                      {formatarMoeda(linhaDetalhe.valor)}
                    </span>
                    <span
                      className={cn(
                        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold',
                        statusBadgeClasses(linhaDetalhe.status),
                      )}
                    >
                      {statusLabel(linhaDetalhe.status)}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Autorização da escala
                  </dt>
                  <dd className="mt-1 text-slate-800">
                    {linhaDetalhe.detalhes.autorizadoPor}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Check-in / Check-out
                  </dt>
                  <dd className="mt-1 space-y-1 text-slate-800">
                    <p>
                      <span className="font-medium text-slate-600">Entrada:</span>{' '}
                      {linhaDetalhe.detalhes.checkIn}
                    </p>
                    <p>
                      <span className="font-medium text-slate-600">Saída:</span>{' '}
                      {linhaDetalhe.detalhes.checkOut}
                    </p>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Observações
                  </dt>
                  <dd className="mt-1 rounded-lg bg-slate-50 px-3 py-2 text-slate-800">
                    {linhaDetalhe.detalhes.observacoes || '—'}
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </div>
      </div>

      <RelatorioGerencialImpressaoModal
        aberto={impressaoGerencialAberta}
        aoFechar={() => setImpressaoGerencialAberta(false)}
        tituloDocumento="Plantões — Relatório gerencial e financeiro"
        periodo={periodoAplicadoLabel}
        linhas={dadosFiltrados}
      />
    </div>
  )
}
