import {
  ArrowLeftRight,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Clock3,
  DollarSign,
  MapPin,
  MessageSquareText,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react'
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameMonth,
  startOfMonth,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useCallback, useMemo, useState } from 'react'

import { cn } from '../../lib/cn'

type StatusAgenda = 'confirmado' | 'vago' | 'pendente'

type PlantaoAgenda = {
  id: string
  data: Date
  local: string
  setor: string
  horaInicio: string
  horaFim: string
  valorPrevisto: number
  status: StatusAgenda
}

type GrupoAgenda = {
  chave: string
  titulo: string
  plantoes: PlantaoAgenda[]
}

const STATUS_LABELS: Record<StatusAgenda, string> = {
  confirmado: 'Confirmado',
  vago: 'Vago',
  pendente: 'Pendente',
}

const STATUS_STYLES: Record<StatusAgenda, string> = {
  confirmado: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  vago: 'border-rose-200 bg-rose-50 text-rose-700',
  pendente: 'border-amber-200 bg-amber-50 text-amber-700',
}

const PROFISSIONAL_LOGADO = 'Dr. João Silva'

function capitalizar(texto: string): string {
  return texto.slice(0, 1).toUpperCase() + texto.slice(1)
}

function formatarMesAno(data: Date): string {
  return capitalizar(format(data, 'MMMM yyyy', { locale: ptBR }))
}

function formatarDiaCurto(data: Date): string {
  return format(data, 'dd MMM', { locale: ptBR })
}

function formatarNomeDia(data: Date): string {
  return capitalizar(format(data, 'EEEE', { locale: ptBR }))
}

function formatarValor(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(valor)
}

function gerarPlantoesMock(): PlantaoAgenda[] {
  const hoje = new Date()

  const offsets = [
    1, 2, 4, 6, 8, 10, 12, 14, 18, 22, 27, 33,
  ]

  const locais = [
    'Hospital Regional Amazonas',
    'Hospital Municipal Central',
    'UPA Norte',
    'Hospital Santa Clara',
  ]

  const setores = [
    'UTI Pediátrica',
    'Enfermaria',
    'PS Adulto',
    'Centro Cirúrgico',
    'UTI Adulto',
  ]

  return offsets.map((offset, index) => {
    const data = addDays(hoje, offset)
    const status: StatusAgenda =
      index % 5 === 0 ? 'vago' : index % 3 === 0 ? 'pendente' : 'confirmado'

    return {
      id: `agenda-${offset}-${index}`,
      data,
      local: locais[index % locais.length] ?? locais[0],
      setor: setores[index % setores.length] ?? setores[0],
      horaInicio: index % 4 === 0 ? '19:00' : '07:00',
      horaFim: index % 4 === 0 ? '07:00' : '19:00',
      valorPrevisto: index % 4 === 0 ? 1800 : index % 2 === 0 ? 1500 : 1200,
      status,
    }
  })
}

function agruparPorMes(plantoes: PlantaoAgenda[]): GrupoAgenda[] {
  const mapa = new Map<string, PlantaoAgenda[]>()

  plantoes.forEach((plantao) => {
    const chave = format(plantao.data, 'yyyy-MM')
    const lista = mapa.get(chave) ?? []
    lista.push(plantao)
    mapa.set(chave, lista)
  })

  return Array.from(mapa.entries()).map(([chave, lista]) => ({
    chave,
    titulo: formatarMesAno(lista[0]?.data ?? new Date()),
    plantoes: lista.sort((a, b) => a.data.getTime() - b.data.getTime()),
  }))
}

function ModalEmDesenvolvimento({
  aberto,
  onFechar,
}: {
  aberto: boolean
  onFechar: () => void
}) {
  if (!aberto) return null

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/55 backdrop-blur-[2px]"
        aria-label="Fechar modal"
        onClick={onFechar}
      />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
        <button
          type="button"
          onClick={onFechar}
          className="absolute right-3 top-3 rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>

        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100 text-slate-700">
            <MessageSquareText className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-slate-900">
              Solicitar troca / repasse
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Em desenvolvimento. Esta ação será integrada ao fluxo de troca do
              plantão.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onFechar}
          className="mt-6 inline-flex h-10 w-full items-center justify-center rounded-lg bg-primary-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
        >
          Entendi
        </button>
      </div>
    </div>
  )
}

export function MinhaAgendaPage() {
  const [dataReferencia, setDataReferencia] = useState(() => new Date())
  const [modalAberto, setModalAberto] = useState(false)

  const plantoes = useMemo(() => {
    return gerarPlantoesMock()
  }, [])

  const plantoesDoMesAtual = useMemo(() => {
    return plantoes.filter((plantao) => isSameMonth(plantao.data, dataReferencia))
  }, [dataReferencia, plantoes])

  const grupos = useMemo(() => agruparPorMes(plantoes), [plantoes])

  const cargaHorariaMes = useMemo(() => {
    return plantoesDoMesAtual.length * 12
  }, [plantoesDoMesAtual.length])

  const irMesAnterior = useCallback(() => {
    setDataReferencia((atual) => addMonths(atual, -1))
  }, [])

  const irProximoMes = useCallback(() => {
    setDataReferencia((atual) => addMonths(atual, 1))
  }, [])

  return (
    <div className="space-y-5 bg-slate-50">
      <header className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-600">
              <CalendarClock className="h-6 w-6" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Agenda individual
              </p>
              <h1 className="text-2xl font-semibold text-slate-900">
                Meus Próximos Plantões
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700">
              <ShieldCheck className="h-4 w-4 text-emerald-500" aria-hidden />
              Plantões este mês: {plantoesDoMesAtual.length}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700">
              <Clock3 className="h-4 w-4 text-primary-500" aria-hidden />
              Carga horária: {cargaHorariaMes}h
            </span>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={irMesAnterior}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
              aria-label="Mês anterior"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
            <div className="min-w-44 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Mês de referência
              </p>
              <h2 className="text-lg font-semibold text-slate-900">
                {formatarMesAno(dataReferencia)}
              </h2>
            </div>
            <button
              type="button"
              onClick={irProximoMes}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
              aria-label="Próximo mês"
            >
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600">
              <Search className="h-4 w-4 text-slate-400" aria-hidden />
              <span>{PROFISSIONAL_LOGADO}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200/80">
        <div className="border-b border-slate-200 px-5 py-4">
          <p className="text-sm font-semibold text-slate-800">
            Próximos plantões organizados por mês
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Lista cronológica focada na visão do profissional logado.
          </p>
        </div>

        <div className="space-y-0 p-4 sm:p-5">
          {grupos.map((grupo) => (
            <section key={grupo.chave} className="relative pb-8 last:pb-0">
              <div className="mb-4 flex items-center gap-3">
                <span className="h-px flex-1 bg-slate-200" />
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {grupo.titulo}
                </span>
                <span className="h-px flex-1 bg-slate-200" />
              </div>

              <div className="space-y-3">
                {grupo.plantoes.map((plantao) => (
                  <article
                    key={plantao.id}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="grid gap-4 lg:grid-cols-[8rem_minmax(0,1fr)_14rem] lg:items-center">
                      <div className="rounded-xl bg-slate-50 p-4 text-center">
                        <p className="text-3xl font-semibold tracking-tight text-slate-900">
                          {format(plantao.data, 'dd', { locale: ptBR })}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-600">
                          {formatarDiaCurto(plantao.data)}
                        </p>
                        <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                          {formatarNomeDia(plantao.data)}
                        </p>
                      </div>

                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-slate-900">
                            {formatarDiaCurto(plantao.data)}
                          </h3>
                          <span className="text-sm text-slate-500">
                            {formatarNomeDia(plantao.data)}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                          <span className="inline-flex items-center gap-1.5">
                            <Clock3 className="h-4 w-4 text-slate-400" aria-hidden />
                            {plantao.horaInicio} - {plantao.horaFim}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-4 w-4 text-slate-400" aria-hidden />
                            {plantao.local}
                          </span>
                        </div>

                        <div className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                            {plantao.setor}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-start gap-3 lg:items-end lg:text-right">
                        <div>
                          <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            <DollarSign className="h-3.5 w-3.5" aria-hidden />
                            Valor previsto
                          </p>
                          <p className="mt-1 text-2xl font-semibold text-slate-900">
                            {formatarValor(plantao.valorPrevisto)}
                          </p>
                        </div>
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold',
                            STATUS_STYLES[plantao.status],
                          )}
                        >
                          {STATUS_LABELS[plantao.status]}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-slate-200 pt-4">
                      <button
                        type="button"
                        onClick={() => setModalAberto(true)}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
                      >
                        <ArrowLeftRight className="h-4 w-4" aria-hidden />
                        Solicitar Troca/Repasse
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
        {eachDayOfInterval({
          start: startOfMonth(dataReferencia),
          end: endOfMonth(dataReferencia),
        }).length}{' '}
        dias no mês exibido.
      </div>

      <ModalEmDesenvolvimento aberto={modalAberto} onFechar={() => setModalAberto(false)} />
    </div>
  )
}
