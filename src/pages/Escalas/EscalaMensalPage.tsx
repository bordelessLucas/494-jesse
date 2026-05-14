import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useCallback, useMemo, useState } from 'react'

import { cn } from '../../lib/cn'
import {
  ModalAlterarPlantao,
  type ContextoModalPlantao,
  type PlantaoCartao,
} from './EscalaSemanalPage'

type LocalMensal = {
  id: string
  nome: string
}

type SetorMensal = {
  id: string
  nome: string
}

type StatusPlantaoMensal = 'vago' | 'confirmado' | 'pendente'

type PlantaoMensal = {
  id: string
  dia: Date
  localId: string
  setorId: string
  profissional: string
  horaInicio: string
  horaFim: string
  status: StatusPlantaoMensal
}

const LOCAIS_MOCK: LocalMensal[] = [
  { id: 'amazonas', nome: 'Hospital Regional Amazonas' },
  { id: 'central', nome: 'Hospital Municipal Central' },
  { id: 'norte', nome: 'UPA Norte' },
]

const SETORES_MOCK: SetorMensal[] = [
  { id: 'uti-ped', nome: 'UTI Pediátrica' },
  { id: 'enfermaria', nome: 'Enfermaria' },
  { id: 'ps-adulto', nome: 'PS Adulto' },
  { id: 'centro-cirurgico', nome: 'Centro Cirúrgico' },
  { id: 'uti-adulto', nome: 'UTI Adulto' },
]

const PROFISSIONAIS_MOCK = [
  'Dr. João Silva',
  'Dra. Carla Mendes',
  'Enf. Ana Paula',
  'Dr. Bruno Lima',
  'Dra. Fernanda Rocha',
  'Enf. Marina Costa',
] as const

const STATUS_LABELS: Record<StatusPlantaoMensal, string> = {
  vago: 'Vago',
  confirmado: 'Confirmado',
  pendente: 'Pendente',
}

const STATUS_STYLES: Record<StatusPlantaoMensal, string> = {
  vago: 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100',
  confirmado:
    'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
  pendente:
    'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100',
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

function gerarMockPlantaoMensal(dias: Date[]): PlantaoMensal[] {
  const diasComMaisPlantao = new Set([2, 4, 5, 8, 10, 12, 15, 18, 20, 22, 24, 27, 29])

  return dias.flatMap((dia, indice) => {
    if (!isSameMonth(dia, dias[Math.floor(dias.length / 2)])) return []

    const numeroDia = dia.getDate()
    if (numeroDia % 2 !== 0 && !diasComMaisPlantao.has(numeroDia)) return []

    const baseLocal = LOCAIS_MOCK[(numeroDia + indice) % LOCAIS_MOCK.length]
    const baseSetor = SETORES_MOCK[(numeroDia + 2) % SETORES_MOCK.length]

    const plantoes: PlantaoMensal[] = [
      {
        id: `${numeroDia}-a`,
        dia: new Date(dia),
        localId: baseLocal.id,
        setorId: baseSetor.id,
        profissional:
          PROFISSIONAIS_MOCK[(numeroDia + indice) % PROFISSIONAIS_MOCK.length],
        horaInicio: '07:00',
        horaFim: '19:00',
        status:
          numeroDia % 3 === 0
            ? 'vago'
            : numeroDia % 2 === 0
              ? 'confirmado'
              : 'pendente',
      },
    ]

    if (numeroDia % 4 === 0 || numeroDia % 5 === 0) {
      plantoes.push({
        id: `${numeroDia}-b`,
        dia: new Date(dia),
        localId: LOCAIS_MOCK[(numeroDia + 1) % LOCAIS_MOCK.length].id,
        setorId: SETORES_MOCK[(numeroDia + 3) % SETORES_MOCK.length].id,
        profissional: PROFISSIONAIS_MOCK[(numeroDia + 1) % PROFISSIONAIS_MOCK.length],
        horaInicio: '13:00',
        horaFim: '19:00',
        status: numeroDia % 5 === 0 ? 'vago' : 'confirmado',
      })
    }

    if (numeroDia % 7 === 0) {
      plantoes.push({
        id: `${numeroDia}-c`,
        dia: new Date(dia),
        localId: LOCAIS_MOCK[(numeroDia + 2) % LOCAIS_MOCK.length].id,
        setorId: SETORES_MOCK[(numeroDia + 4) % SETORES_MOCK.length].id,
        profissional: PROFISSIONAIS_MOCK[(numeroDia + 2) % PROFISSIONAIS_MOCK.length],
        horaInicio: '19:00',
        horaFim: '07:00',
        status: 'pendente',
      })
    }

    return plantoes
  })
}

function contextoParaPlantao(
  plantao: PlantaoMensal,
): ContextoModalPlantao {
  return {
    dia: new Date(plantao.dia),
    cartao: {
      id: plantao.id,
      nome: plantao.profissional,
      horaInicio: plantao.horaInicio,
      horaFim: plantao.horaFim,
      tom: plantao.status === 'vago' ? 'fds' : 'util',
    } satisfies PlantaoCartao,
    localId: plantao.localId,
    setorId: plantao.setorId,
  }
}

function statusClassName(status: StatusPlantaoMensal): string {
  return STATUS_STYLES[status]
}

export function EscalaMensalPage() {
  const [dataReferencia, setDataReferencia] = useState(() => new Date())
  const [localSelecionado, setLocalSelecionado] = useState(TODOS_LOCAIS)
  const [setorSelecionado, setSetorSelecionado] = useState(TODOS_SETORES)
  const [plantaoModal, setPlantaoModal] = useState<ContextoModalPlantao | null>(null)

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

  const plantoes = useMemo(() => gerarMockPlantaoMensal(diasCalendario), [diasCalendario])

  const mesAnoLabel = useMemo(() => formatarMesAno(dataReferencia), [dataReferencia])

  const irMesAnterior = useCallback(() => {
    setDataReferencia((atual) => addMonths(atual, -1))
  }, [])

  const irProximoMes = useCallback(() => {
    setDataReferencia((atual) => addMonths(atual, 1))
  }, [])

  const abrirNovoPlantao = useCallback(() => {
    const diaBase = startOfMonth(dataReferencia)
    setPlantaoModal({
      dia: diaBase,
      cartao: {
        id: `novo-${diaBase.toISOString()}`,
        nome: 'Novo plantão',
        horaInicio: '07:00',
        horaFim: '19:00',
        tom: 'util',
      },
      localId: LOCAIS_MOCK[0].id,
      setorId: SETORES_MOCK[0].id,
    })
  }, [dataReferencia])

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

  return (
    <div className="space-y-4">
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
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-3 lg:max-w-4xl lg:flex-row lg:items-end">
            <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm font-medium text-slate-700">
              Local / Hospital
              <select
                className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                value={localSelecionado}
                onChange={(e) => setLocalSelecionado(e.target.value)}
              >
                <option value={TODOS_LOCAIS}>Todos os locais</option>
                {LOCAIS_MOCK.map((local) => (
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
              >
                <option value={TODOS_SETORES}>Todos os setores</option>
                {SETORES_MOCK.map((setor) => (
                  <option key={setor.id} value={setor.id}>
                    {setor.nome}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={abrirNovoPlantao}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
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
                const chave = format(dia, 'yyyy-MM-dd')
                const listaDia = plantoesPorDia.get(chave) ?? []

                return (
                  <article
                    key={chave}
                    className={cn(
                      'min-h-30 bg-white p-3 transition-colors',
                      foraDoMes && 'bg-slate-50 text-slate-400',
                    )}
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="min-h-5">
                        <p
                          className={cn(
                            'text-xs font-semibold uppercase tracking-wide',
                            foraDoMes ? 'text-slate-400' : 'text-slate-500',
                          )}
                        >
                          {format(dia, 'EEE', { locale: ptBR })}
                        </p>
                      </div>
                      <span
                        className={cn(
                          'text-lg font-semibold tabular-nums leading-none',
                          foraDoMes ? 'text-slate-300' : 'text-slate-900',
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
                        const local = LOCAIS_MOCK.find((item) => item.id === plantao.localId)
                        const setor = SETORES_MOCK.find((item) => item.id === plantao.setorId)
                        const textoBadge = `${formatarPeriodoBadge(
                          plantao.horaInicio,
                          plantao.horaFim,
                        )} ${setor?.nome ?? 'Setor'} - ${plantao.profissional}`

                        return (
                          <button
                            key={plantao.id}
                            type="button"
                            onClick={() => setPlantaoModal(contextoParaPlantao(plantao))}
                            className={cn(
                              'group flex w-full items-center justify-between gap-2 rounded-md border px-2 py-1.5 text-left text-[11px] font-medium shadow-sm transition-colors',
                              statusClassName(plantao.status),
                            )}
                            title={`${local?.nome ?? 'Local'} · ${STATUS_LABELS[plantao.status]}`}
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
      />
    </div>
  )
}
