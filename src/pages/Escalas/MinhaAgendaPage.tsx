import {
  ArrowLeftRight,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Clock3,
  DollarSign,
  Loader2,
  MapPin,
  MessageSquareText,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameMonth,
  startOfMonth,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'

import { useSupabaseUser } from '../../hooks/useSupabaseUser'
import { cn } from '../../lib/cn'
import { supabase } from '../../lib/supabase'
import {
  buscarPlantoesDoProfissional,
  buscarProfissionaisComLocal,
  profissionalIdPorEmailPreferido,
  STORAGE_MINHA_AGENDA_PROFISSIONAL,
  type PlantaoDashboardRow,
  type ProfissionalCargaRow,
} from '../../lib/dashboard/dashboardQueries'
import {
  dataLocalAPartirDeIsoData,
  formatarHoraDb,
} from '../../lib/escalas/plantoesDb'
import type { StatusPlantaoEscala } from '../../lib/escalas/escalaTypes'
import { duracaoHorasPlantao } from '../../lib/dashboard/plantaoHoras'

type StatusAgenda = StatusPlantaoEscala

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
  realizado: 'Realizado',
  pendente_troca: 'Troca/Repasse',
}

const STATUS_STYLES: Record<StatusAgenda, string> = {
  confirmado: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  vago: 'border-rose-200 bg-rose-50 text-rose-700',
  pendente: 'border-amber-200 bg-amber-50 text-amber-700',
  realizado: 'border-sky-200 bg-sky-50 text-sky-800',
  pendente_troca: 'border-violet-200 bg-violet-50 text-violet-700',
}

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

function linhaDbParaPlantaoAgenda(row: PlantaoDashboardRow): PlantaoAgenda {
  return {
    id: row.id,
    data: dataLocalAPartirDeIsoData(row.data_plantao),
    local: row.locais?.nome_fantasia?.trim() ?? 'Local',
    setor: row.setores?.nome?.trim() ?? 'Setor',
    horaInicio: formatarHoraDb(row.hora_inicio),
    horaFim: formatarHoraDb(row.hora_fim),
    valorPrevisto: row.valor_plantao ?? 0,
    status: row.status,
  }
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

function ModalSolicitarTrocaRepasse({
  aberto,
  plantao,
  onFechar,
  onConfirmado,
}: {
  aberto: boolean
  plantao: PlantaoAgenda | null
  onFechar: () => void
  onConfirmado: () => void
}) {
  const [salvando, setSalvando] = useState(false)
  const isAberto = aberto && plantao !== null
  if (!isAberto) return null

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
              Ao confirmar, este plantão será anunciado no mural para que outro
              profissional se candidate. A coordenação aprova a troca.
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={salvando}
          onClick={async () => {
            if (!plantao) return
            setSalvando(true)
            try {
              const { error } = await supabase
                .from('plantoes')
                .update({
                  status: 'pendente_troca',
                  disponivel_mural: true,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', plantao.id)

              if (error) {
                toast.error(error.message)
                return
              }

              toast.success('Plantão anunciado no mural com sucesso!')
              onConfirmado()
              onFechar()
            } finally {
              setSalvando(false)
            }
          }}
          className="mt-6 inline-flex h-10 w-full items-center justify-center rounded-lg bg-primary-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
        >
          {salvando ? 'Anunciando…' : 'Confirmar anúncio'}
        </button>
      </div>
    </div>
  )
}

function escolherProfissionalIdInicial(
  rows: ProfissionalCargaRow[],
  emailSessao: string | null | undefined,
): string | null {
  if (rows.length === 0) return null
  const guardado =
    typeof localStorage !== 'undefined'
      ? localStorage.getItem(STORAGE_MINHA_AGENDA_PROFISSIONAL)
      : null
  if (guardado && rows.some((r) => r.id === guardado)) return guardado
  const porEmail = profissionalIdPorEmailPreferido(rows, emailSessao)
  if (porEmail) return porEmail
  if (rows.length === 1) return rows[0].id
  return null
}

export function MinhaAgendaPage() {
  const { user, isLoading: isLoadingUser } = useSupabaseUser()
  const [dataReferencia, setDataReferencia] = useState(() => new Date())
  const [modalAberto, setModalAberto] = useState(false)
  const [plantaoSelecionado, setPlantaoSelecionado] = useState<PlantaoAgenda | null>(
    null,
  )

  const [profissionaisDetalhe, setProfissionaisDetalhe] = useState<
    ProfissionalCargaRow[]
  >([])
  const [profissionalId, setProfissionalId] = useState<string | null>(null)
  const [plantoesRows, setPlantoesRows] = useState<PlantaoDashboardRow[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (isLoadingUser || !user) return
    const uid = user.id
    const email = user.email
    let cancelado = false

    async function loadProfissionais() {
      try {
        const rows = await buscarProfissionaisComLocal(uid)
        if (cancelado) return
        setProfissionaisDetalhe(rows)
        setProfissionalId((atual) => {
          if (atual && rows.some((o) => o.id === atual)) return atual
          return escolherProfissionalIdInicial(rows, email)
        })
      } catch (e) {
        if (!cancelado) {
          setErro(e instanceof Error ? e.message : 'Erro ao carregar profissionais.')
        }
      }
    }

    void loadProfissionais()
    return () => {
      cancelado = true
    }
  }, [user, isLoadingUser])

  const profissionais = useMemo(
    () => profissionaisDetalhe.map((r) => ({ id: r.id, nome: r.nome })),
    [profissionaisDetalhe],
  )

  const intervaloPlantoes = useMemo(() => {
    const hoje = new Date()
    const min = format(addMonths(startOfMonth(hoje), -6), 'yyyy-MM-dd')
    const max = format(addMonths(endOfMonth(hoje), 36), 'yyyy-MM-dd')
    return { min, max }
  }, [])

  useEffect(() => {
    if (isLoadingUser || !user || !profissionalId) {
      if (!isLoadingUser && user && profissionaisDetalhe.length > 0 && !profissionalId) {
        setPlantoesRows([])
        setCarregando(false)
      }
      return
    }
    const userId = user.id
    const pid = profissionalId
    let cancelado = false

    async function loadPlantoes() {
      setCarregando(true)
      setErro(null)
      try {
        const linhas = await buscarPlantoesDoProfissional(
          userId,
          pid,
          intervaloPlantoes.min,
          intervaloPlantoes.max,
        )
        if (cancelado) return
        setPlantoesRows(linhas)
      } catch (e) {
        if (!cancelado) {
          setErro(e instanceof Error ? e.message : 'Erro ao carregar plantões.')
        }
      } finally {
        if (!cancelado) setCarregando(false)
      }
    }

    void loadPlantoes()
    return () => {
      cancelado = true
    }
  }, [
    user,
    isLoadingUser,
    profissionalId,
    intervaloPlantoes.min,
    intervaloPlantoes.max,
    profissionaisDetalhe.length,
  ])

  const profissionalNome =
    profissionais.find((p) => p.id === profissionalId)?.nome ?? 'Selecione um profissional'

  const plantoes = useMemo(
    () => plantoesRows.map(linhaDbParaPlantaoAgenda),
    [plantoesRows],
  )

  const plantoesDoMesAtual = useMemo(() => {
    return plantoes.filter((plantao) =>
      isSameMonth(plantao.data, dataReferencia),
    )
  }, [dataReferencia, plantoes])

  const grupos = useMemo(() => agruparPorMes(plantoes), [plantoes])

  const cargaHorariaMes = useMemo(() => {
    const total = plantoesDoMesAtual.reduce(
      (acc, p) =>
        acc +
        duracaoHorasPlantao(
          format(p.data, 'yyyy-MM-dd'),
          p.horaInicio,
          p.horaFim,
        ),
      0,
    )
    return Math.round(total)
  }, [plantoesDoMesAtual])

  const irMesAnterior = useCallback(() => {
    setDataReferencia((atual) => addMonths(atual, -1))
  }, [])

  const irProximoMes = useCallback(() => {
    setDataReferencia((atual) => addMonths(atual, 1))
  }, [])

  const aoMudarProfissional = useCallback((id: string) => {
    setProfissionalId(id)
    try {
      localStorage.setItem(STORAGE_MINHA_AGENDA_PROFISSIONAL, id)
    } catch {
      /* ignore */
    }
  }, [])

  if (isLoadingUser) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-slate-600">
        <Loader2 className="h-6 w-6 animate-spin text-primary-600" aria-hidden />
        <span>A carregar…</span>
      </div>
    )
  }

  return (
    <div className="space-y-5 bg-slate-50">
      {erro ? (
        <div
          className="rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-800"
          role="alert"
        >
          {erro}
        </div>
      ) : null}

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
              Plantões este mês:{' '}
              {carregando ? '…' : plantoesDoMesAtual.length}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700">
              <Clock3 className="h-4 w-4 text-primary-500" aria-hidden />
              Carga horária: {carregando ? '…' : `${cargaHorariaMes}h`}
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

          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
            <div className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600">
              <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
              <span className="truncate">{profissionalNome}</span>
            </div>
            {profissionais.length > 0 ? (
              <select
                className="min-w-56 rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm font-medium text-slate-800 shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={profissionalId ?? ''}
                onChange={(e) => aoMudarProfissional(e.target.value)}
                aria-label="Profissional para ver a agenda"
              >
                <option value="" disabled>
                  Escolher profissional
                </option>
                {profissionais.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
        </div>
      </header>

      {!profissionalId && profissionais.length > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Selecione um profissional para ver os plantões. O sistema usa o e-mail da
          conta quando coincide com o cadastro do profissional; caso contrário,
          escolha manualmente (a escolha fica guardada neste navegador).
        </div>
      ) : null}

      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200/80">
        <div className="border-b border-slate-200 px-5 py-4">
          <p className="text-sm font-semibold text-slate-800">
            Próximos plantões organizados por mês
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Dados da tabela «plantões» no Supabase, filtrados pelo profissional
            selecionado.
          </p>
        </div>

        <div className="space-y-0 p-4 sm:p-5">
          {carregando ? (
            <div className="flex items-center justify-center gap-2 py-16 text-slate-600">
              <Loader2 className="h-6 w-6 animate-spin text-primary-600" aria-hidden />
              A carregar plantões…
            </div>
          ) : !profissionalId ? (
            <p className="py-12 text-center text-sm text-slate-500">
              Nenhum profissional selecionado.
            </p>
          ) : grupos.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-500">
              Nenhum plantão encontrado para este profissional no intervalo
              carregado.
            </p>
          ) : (
            grupos.map((grupo) => (
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

                      {plantao.data.getTime() > Date.now() ? (
                        <div className="mt-4 border-t border-slate-200 pt-4">
                          <button
                            type="button"
                            onClick={() => {
                              setPlantaoSelecionado(plantao)
                              setModalAberto(true)
                            }}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
                          >
                            <ArrowLeftRight className="h-4 w-4" aria-hidden />
                            Solicitar Troca/Repasse
                          </button>
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
        {eachDayOfInterval({
          start: startOfMonth(dataReferencia),
          end: endOfMonth(dataReferencia),
        }).length}{' '}
        dias no mês exibido.
      </div>

      <ModalSolicitarTrocaRepasse
        aberto={modalAberto}
        plantao={plantaoSelecionado}
        onFechar={() => {
          setModalAberto(false)
          setPlantaoSelecionado(null)
        }}
        onConfirmado={() => {
          // Recarrega os dados para refletir o anúncio.
          setPlantoesRows((rows) => [...rows])
        }}
      />
    </div>
  )
}
