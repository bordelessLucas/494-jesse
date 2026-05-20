import { ChevronLeft, ChevronRight, Loader2, Plus } from 'lucide-react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { cn } from '../../lib/cn'
import { useSupabaseUser } from '../../hooks/useSupabaseUser'
import type { StatusPlantaoEscala } from '../../lib/escalas/escalaTypes'
import {
  buscarLocaisEscala,
  buscarPlantoesIntervalo,
  buscarProfissionaisEscala,
  buscarSetoresEscala,
  dataLocalAPartirDeIsoData,
  plantaoRowParaCartao,
  tomParaData,
  type PlantaoRowDb,
} from '../../lib/escalas/plantoesDb'
import { ModalAlterarPlantao, type ContextoModalPlantao } from './EscalaSemanalPage'

type PlantaoMensal = {
  id: string
  dia: Date
  localId: string
  setorId: string
  profissional: string
  horaInicio: string
  horaFim: string
  status: StatusPlantaoEscala
  profissionalId: string | null
}

const STATUS_LABELS: Record<StatusPlantaoEscala, string> = {
  vago: 'Vago',
  confirmado: 'Confirmado',
  pendente: 'Pendente',
  realizado: 'Realizado',
}

const STATUS_STYLES: Record<StatusPlantaoEscala, string> = {
  vago: 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100',
  confirmado:
    'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
  pendente:
    'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100',
  realizado:
    'border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100',
}

const TODOS_LOCAIS = 'todos-locais'
const TODOS_SETORES = 'todos-setores'

function capitalizar(texto: string): string {
  return texto.slice(0, 1).toUpperCase() + texto.slice(1)
}

function formatarMesAno(data: Date): string {
  return capitalizar(format(data, 'MMMM yyyy', { locale: ptBR }))
}

function formatarPeriodoBadge(horaInicio: string, horaFim: string): string {
  return `[${horaInicio.slice(0, 2)}h-${horaFim.slice(0, 2)}h]`
}

function rowParaPlantaoMensal(row: PlantaoRowDb): PlantaoMensal {
  const cartao = plantaoRowParaCartao(row)
  return {
    id: row.id,
    dia: dataLocalAPartirDeIsoData(row.data_plantao),
    localId: row.local_id,
    setorId: row.setor_id,
    profissional: cartao.nome,
    horaInicio: cartao.horaInicio,
    horaFim: cartao.horaFim,
    status: row.status,
    profissionalId: row.profissional_id,
  }
}

function contextoParaPlantao(plantao: PlantaoMensal): ContextoModalPlantao {
  return {
    dia: new Date(plantao.dia),
    cartao: {
      id: plantao.id,
      nome: plantao.profissional,
      horaInicio: plantao.horaInicio,
      horaFim: plantao.horaFim,
      tom: tomParaData(plantao.dia),
      status: plantao.status,
      profissionalId: plantao.profissionalId,
    },
    localId: plantao.localId,
    setorId: plantao.setorId,
    plantaoId: plantao.id,
    profissionalId: plantao.profissionalId,
  }
}

function statusClassName(status: StatusPlantaoEscala): string {
  return STATUS_STYLES[status]
}

export function EscalaMensalPage() {
  const { user, isLoading: authLoading } = useSupabaseUser()
  const [dataReferencia, setDataReferencia] = useState(() => new Date())
  const [localSelecionado, setLocalSelecionado] = useState(TODOS_LOCAIS)
  const [setorSelecionado, setSetorSelecionado] = useState(TODOS_SETORES)
  const [plantaoModal, setPlantaoModal] = useState<ContextoModalPlantao | null>(null)

  const [locais, setLocais] = useState<{ id: string; nome: string }[]>([])
  const [setores, setSetores] = useState<
    { id: string; nome: string; local_id: string }[]
  >([])
  const [profissionais, setProfissionais] = useState<{ id: string; nome: string }[]>(
    [],
  )
  const [plantoesRows, setPlantoesRows] = useState<PlantaoRowDb[]>([])
  const [carregando, setCarregando] = useState(true)
  const [carregandoPlantoes, setCarregandoPlantoes] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const inicioMes = useMemo(() => startOfMonth(dataReferencia), [dataReferencia])
  const fimMes = useMemo(() => endOfMonth(dataReferencia), [dataReferencia])

  const diasCalendario = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(inicioMes, { weekStartsOn: 0 }),
        end: endOfWeek(fimMes, { weekStartsOn: 0 }),
      }),
    [fimMes, inicioMes],
  )

  const dataMinGrade = useMemo(
    () => format(diasCalendario[0], 'yyyy-MM-dd'),
    [diasCalendario],
  )
  const dataMaxGrade = useMemo(
    () => format(diasCalendario[diasCalendario.length - 1], 'yyyy-MM-dd'),
    [diasCalendario],
  )

  const nomesLocais = useMemo(
    () => new Map(locais.map((l) => [l.id, l.nome] as const)),
    [locais],
  )
  const nomesSetores = useMemo(
    () => new Map(setores.map((s) => [s.id, s.nome] as const)),
    [setores],
  )

  const setoresFiltradosSelect = useMemo(() => {
    if (localSelecionado === TODOS_LOCAIS) return setores
    return setores.filter((s) => s.local_id === localSelecionado)
  }, [localSelecionado, setores])

  const carregarCatalogo = useCallback(async () => {
    if (authLoading) return
    const uid = user?.id
    if (!uid) {
      setLocais([])
      setSetores([])
      setProfissionais([])
      setCarregando(false)
      return
    }
    setCarregando(true)
    setErro(null)
    try {
      const [L, S, P] = await Promise.all([
        buscarLocaisEscala(uid),
        buscarSetoresEscala(uid),
        buscarProfissionaisEscala(uid),
      ])
      setLocais(L)
      setSetores(
        S.map((s) => ({ id: s.id, nome: s.nome, local_id: s.local_id })),
      )
      setProfissionais(P)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar')
    } finally {
      setCarregando(false)
    }
  }, [authLoading, user?.id])

  useEffect(() => {
    void carregarCatalogo()
  }, [carregarCatalogo])

  const carregarPlantoesGrade = useCallback(async () => {
    if (!user?.id) {
      setPlantoesRows([])
      return
    }
    setCarregandoPlantoes(true)
    try {
      const rows = await buscarPlantoesIntervalo(
        user.id,
        dataMinGrade,
        dataMaxGrade,
      )
      setPlantoesRows(rows)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar plantões')
    } finally {
      setCarregandoPlantoes(false)
    }
  }, [dataMaxGrade, dataMinGrade, user?.id])

  useEffect(() => {
    void carregarPlantoesGrade()
  }, [carregarPlantoesGrade])

  useEffect(() => {
    if (setorSelecionado === TODOS_SETORES) return
    if (!setoresFiltradosSelect.some((s) => s.id === setorSelecionado)) {
      setSetorSelecionado(TODOS_SETORES)
    }
  }, [setorSelecionado, setoresFiltradosSelect])

  const plantoes = useMemo(
    () => plantoesRows.map(rowParaPlantaoMensal),
    [plantoesRows],
  )

  const mesAnoLabel = useMemo(() => formatarMesAno(dataReferencia), [dataReferencia])

  const irMesAnterior = useCallback(() => {
    setDataReferencia((atual) => addMonths(atual, -1))
  }, [])

  const irProximoMes = useCallback(() => {
    setDataReferencia((atual) => addMonths(atual, 1))
  }, [])

  const primeiroLocalId = locais[0]?.id ?? ''
  const primeiroSetorDoLocal =
    setores.find((s) => s.local_id === primeiroLocalId)?.id ?? setores[0]?.id ?? ''

  const abrirNovoPlantao = useCallback(() => {
    const diaBase = startOfMonth(dataReferencia)
    const localIni =
      localSelecionado !== TODOS_LOCAIS ? localSelecionado : primeiroLocalId
    const setoresLoc = setores.filter((s) => s.local_id === localIni)
    const setorIni =
      setorSelecionado !== TODOS_SETORES && setoresLoc.some((s) => s.id === setorSelecionado)
        ? setorSelecionado
        : setoresLoc[0]?.id ?? primeiroSetorDoLocal

    setPlantaoModal({
      dia: diaBase,
      cartao: {
        id: 'rascunho',
        nome: 'Novo plantão',
        horaInicio: '07:00',
        horaFim: '19:00',
        tom: tomParaData(diaBase),
        status: 'pendente',
      },
      localId: localIni || primeiroLocalId,
      setorId: setorIni || primeiroSetorDoLocal,
      plantaoId: undefined,
      profissionalId: null,
    })
  }, [
    dataReferencia,
    localSelecionado,
    primeiroLocalId,
    primeiroSetorDoLocal,
    setorSelecionado,
    setores,
  ])

  const plantoesFiltrados = useMemo(() => {
    return plantoes.filter((plantao) => {
      const combinaLocal =
        localSelecionado === TODOS_LOCAIS || plantao.localId === localSelecionado
      const combinaSetor =
        setorSelecionado === TODOS_SETORES || plantao.setorId === setorSelecionado
      return combinaLocal && combinaSetor
    })
  }, [localSelecionado, plantoes, setorSelecionado])

  const plantoesPorDia = useMemo(() => {
    const mapa = new Map<string, PlantaoMensal[]>()
    plantoesFiltrados.forEach((plantao) => {
      const chave = format(plantao.dia, 'yyyy-MM-dd')
      const lista = mapa.get(chave) ?? []
      lista.push(plantao)
      mapa.set(chave, lista)
    })
    return mapa
  }, [plantoesFiltrados])

  const setoresModal = useMemo(
    () =>
      setores.map((s) => ({
        id: s.id,
        nome: s.nome,
        local_id: s.local_id,
      })),
    [setores],
  )

  return (
    <div className="space-y-4">
      {erro ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {erro}
        </div>
      ) : null}

      <header className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
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
                  Mês / Ano
                </p>
                <h1 className="text-xl font-semibold text-slate-900">{mesAnoLabel}</h1>
              </div>
              <button
                type="button"
                onClick={irProximoMes}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
                aria-label="Próximo mês"
              >
                <ChevronRight className="h-5 w-5" aria-hidden />
              </button>
              {carregandoPlantoes ? (
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" aria-hidden />
              ) : null}
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-3 lg:max-w-4xl lg:flex-row lg:items-end">
            <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm font-medium text-slate-700">
              Local / Hospital
              <select
                className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                value={localSelecionado}
                onChange={(e) => setLocalSelecionado(e.target.value)}
                disabled={carregando || locais.length === 0}
              >
                <option value={TODOS_LOCAIS}>Todos os locais</option>
                {locais.map((local) => (
                  <option key={local.id} value={local.id}>
                    {local.nome}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm font-medium text-slate-700">
              Setor
              <select
                className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                value={setorSelecionado}
                onChange={(e) => setSetorSelecionado(e.target.value)}
                disabled={carregando}
              >
                <option value={TODOS_SETORES}>Todos os setores</option>
                {setoresFiltradosSelect.map((setor) => (
                  <option key={setor.id} value={setor.id}>
                    {setor.nome}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={abrirNovoPlantao}
              disabled={carregando || !user?.id || !primeiroLocalId}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Novo Plantão
            </button>
          </div>
        </div>
      </header>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200/80">
        <div className="overflow-x-auto">
          <div className="min-w-245">
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-900 text-white">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dia) => (
                <div
                  key={dia}
                  className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-white/85"
                >
                  {dia}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 divide-x divide-y divide-slate-200">
              {diasCalendario.map((dia) => {
                const foraDoMes = !isSameMonth(dia, dataReferencia)
                const ehHoje = isToday(dia)
                const chave = format(dia, 'yyyy-MM-dd')
                const listaDia = plantoesPorDia.get(chave) ?? []

                return (
                  <article
                    key={chave}
                    aria-current={ehHoje ? 'date' : undefined}
                    className={cn(
                      'min-h-30 bg-white p-3 transition-colors',
                      foraDoMes && 'bg-slate-50 text-slate-400',
                      ehHoje &&
                        'relative z-[1] ring-2 ring-inset ring-primary-600 bg-primary-50/80 shadow-[inset_0_0_0_1px] shadow-primary-500/30',
                    )}
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="min-h-5">
                        <p
                          className={cn(
                            'text-xs font-semibold uppercase tracking-wide',
                            foraDoMes && !ehHoje ? 'text-slate-400' : 'text-slate-500',
                            ehHoje && 'text-primary-700',
                          )}
                        >
                          {format(dia, 'EEE', { locale: ptBR })}
                        </p>
                      </div>
                      <span
                        className={cn(
                          'grid h-8 min-w-8 place-items-center rounded-full text-lg font-semibold tabular-nums leading-none',
                          foraDoMes && !ehHoje ? 'text-slate-300' : 'text-slate-900',
                          ehHoje &&
                            'bg-primary-600 text-white shadow-sm ring-2 ring-primary-400 ring-offset-1 ring-offset-primary-50',
                        )}
                      >
                        {dia.getDate()}
                      </span>
                    </div>

                    <div
                      className={cn(
                        'max-h-30 space-y-1 overflow-y-auto pr-1',
                        '[scrollbar-width:thin] [scrollbar-color:rgb(203_213_225)_transparent]',
                        '[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent',
                        '[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300',
                      )}
                    >
                      {listaDia.map((plantao) => {
                        const localNome = nomesLocais.get(plantao.localId) ?? 'Local'
                        const setorNome = nomesSetores.get(plantao.setorId) ?? 'Setor'
                        const textoBadge = `${formatarPeriodoBadge(
                          plantao.horaInicio,
                          plantao.horaFim,
                        )} ${setorNome} - ${plantao.profissional}`

                        return (
                          <button
                            key={plantao.id}
                            type="button"
                            onClick={() =>
                              setPlantaoModal(contextoParaPlantao(plantao))
                            }
                            className={cn(
                              'group flex w-full items-center justify-between gap-2 rounded-md border px-2 py-1.5 text-left text-[11px] font-medium shadow-sm transition-colors',
                              statusClassName(plantao.status),
                            )}
                            title={`${localNome} · ${STATUS_LABELS[plantao.status]}`}
                          >
                            <span className="min-w-0 flex-1 truncate">{textoBadge}</span>
                            <span className="shrink-0 rounded-full bg-white/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                              {STATUS_LABELS[plantao.status]}
                            </span>
                          </button>
                        )
                      })}

                      {!listaDia.length ? (
                        <div className="flex min-h-13 items-center justify-center rounded-md border border-dashed border-slate-200 bg-white/60 text-center text-[11px] text-slate-400">
                          Sem plantões
                        </div>
                      ) : null}
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          Confirmado
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
          Vago
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
          Pendente
        </span>
      </div>

      <ModalAlterarPlantao
        aberto={plantaoModal !== null}
        contexto={plantaoModal}
        onFechar={() => setPlantaoModal(null)}
        userId={user?.id ?? null}
        locais={locais}
        setores={setoresModal}
        profissionais={profissionais}
        onPlantaoMutado={() => void carregarPlantoesGrade()}
      />
    </div>
  )
}
