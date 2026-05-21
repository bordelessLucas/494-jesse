import { useEffect, useId, useMemo, useState } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import {
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from 'date-fns'

import { useSupabaseUser } from '../../hooks/useSupabaseUser'
import { cn } from '../../lib/cn'
import {
  buscarPlantoesIntervaloComLocaisSetores,
  buscarProfissionaisComLocal,
  type PlantaoDashboardRow,
  type ProfissionalCargaRow,
} from '../../lib/dashboard/dashboardQueries'
import {
  duracaoHorasPlantao,
  metaHorasMensalContrato,
  metaHorasSemanalContrato,
} from '../../lib/dashboard/plantaoHoras'

type PeriodoCarga = 'mes-atual' | 'semana-atual'

type StatusCarga = 'ok' | 'warning' | 'danger'

type ProfissionalCarga = {
  id: string
  nome: string
  especialidade: string
  hospitalSetor: string
  horasAtuais: number
  horasMeta: number
  fotoUrl: string | null
}

const SELECT_CLASS =
  'min-w-44 rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm text-slate-800 shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'

type FiltroRapido = 'todos' | 'ok' | 'alerta'

function fotoDoDetalhes(detalhes: unknown): string | null {
  const d = detalhes as { fotoUrl?: string | null } | null
  const u = d?.fotoUrl?.trim()
  return u || null
}

function especialidadeRotulo(
  detalhes: unknown,
  profissao: string,
): string {
  const d = detalhes as { especialidade?: string } | null
  const e = d?.especialidade?.trim()
  return e || profissao
}

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  const a = partes[0]?.[0] ?? ''
  const b = partes.length > 1 ? partes[partes.length - 1][0] : ''
  return (a + b).toUpperCase() || '?'
}

function statusCarga(p: ProfissionalCarga): StatusCarga {
  const { horasAtuais, horasMeta } = p
  if (horasAtuais <= horasMeta) return 'ok'
  const limiteAlerta = horasMeta * 1.5
  if (horasAtuais <= limiteAlerta) return 'warning'
  return 'danger'
}

function corBarra(status: StatusCarga) {
  switch (status) {
    case 'ok':
      return 'bg-success-500'
    case 'warning':
      return 'bg-warning-500'
    default:
      return 'bg-danger-500'
  }
}

function acumularHorasPorProfissional(
  plantoes: PlantaoDashboardRow[],
): Map<string, number> {
  const map = new Map<string, number>()
  for (const p of plantoes) {
    if (!p.profissional_id) continue
    const h = duracaoHorasPlantao(p.data_plantao, p.hora_inicio, p.hora_fim)
    const cur = map.get(p.profissional_id) ?? 0
    map.set(p.profissional_id, cur + h)
  }
  return map
}

export function CargaHorariaPage() {
  const periodoId = useId()
  const hospitalId = useId()
  const { user, isLoading: isLoadingUser } = useSupabaseUser()

  const [periodo, setPeriodo] = useState<PeriodoCarga>('mes-atual')
  const [hospitalSetorFiltro, setHospitalSetorFiltro] = useState<string>('todos')
  const [filtroRapido, setFiltroRapido] = useState<FiltroRapido>('todos')
  const [profRows, setProfRows] = useState<ProfissionalCargaRow[]>([])
  const [plantoes, setPlantoes] = useState<PlantaoDashboardRow[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const intervalo = useMemo(() => {
    const agora = new Date()
    if (periodo === 'mes-atual') {
      const ini = startOfMonth(agora)
      const fim = endOfMonth(agora)
      return {
        minIso: format(ini, 'yyyy-MM-dd'),
        maxIso: format(fim, 'yyyy-MM-dd'),
      }
    }
    const ini = startOfWeek(agora, { weekStartsOn: 1 })
    const fim = endOfWeek(agora, { weekStartsOn: 1 })
    return {
      minIso: format(ini, 'yyyy-MM-dd'),
      maxIso: format(fim, 'yyyy-MM-dd'),
    }
  }, [periodo])

  useEffect(() => {
    if (isLoadingUser || !user) return
    const userId = user.id
    let cancelado = false

    async function load() {
      setCarregando(true)
      setErro(null)
      try {
        const [profissionais, plinhas] = await Promise.all([
          buscarProfissionaisComLocal(userId),
          buscarPlantoesIntervaloComLocaisSetores(
            userId,
            intervalo.minIso,
            intervalo.maxIso,
          ),
        ])
        if (cancelado) return
        setProfRows(profissionais)
        setPlantoes(plinhas)
      } catch (e) {
        if (!cancelado) {
          setErro(e instanceof Error ? e.message : 'Erro ao carregar dados.')
        }
      } finally {
        if (!cancelado) setCarregando(false)
      }
    }

    void load()
    return () => {
      cancelado = true
    }
  }, [user, isLoadingUser, intervalo.minIso, intervalo.maxIso])

  const horasPorProf = useMemo(
    () => acumularHorasPorProfissional(plantoes),
    [plantoes],
  )

  const listaProfissionais: ProfissionalCarga[] = useMemo(() => {
    return profRows.map((r) => {
      const horasBrutas = horasPorProf.get(r.id) ?? 0
      const horasAtuais = Math.round(horasBrutas)
      const meta =
        periodo === 'mes-atual'
          ? metaHorasMensalContrato(r.detalhes)
          : metaHorasSemanalContrato(r.detalhes)
      const localNome = r.locais?.nome_fantasia?.trim() ?? 'Sem local definido'
      return {
        id: r.id,
        nome: r.nome,
        especialidade: especialidadeRotulo(r.detalhes, r.profissao),
        hospitalSetor: `${localNome} — ${r.profissao}`,
        horasAtuais,
        horasMeta: meta,
        fotoUrl: fotoDoDetalhes(r.detalhes),
      }
    })
  }, [profRows, horasPorProf, periodo])

  const opcoesHospitalSetor = useMemo(() => {
    const set = new Set(listaProfissionais.map((p) => p.hospitalSetor))
    return Array.from(set).sort()
  }, [listaProfissionais])

  const listaFiltrada = useMemo(() => {
    return listaProfissionais.filter((p) => {
      if (
        hospitalSetorFiltro !== 'todos' &&
        p.hospitalSetor !== hospitalSetorFiltro
      ) {
        return false
      }
      const s = statusCarga(p)
      if (filtroRapido === 'ok' && s !== 'ok') return false
      if (filtroRapido === 'alerta' && s === 'ok') return false
      return true
    })
  }, [listaProfissionais, hospitalSetorFiltro, filtroRapido])

  if (isLoadingUser || (carregando && profRows.length === 0 && !erro)) {
    return (
      <div className="flex min-h-[40vh] flex-1 items-center justify-center gap-2 bg-slate-50 p-6 text-slate-600">
        <Loader2 className="h-6 w-6 animate-spin text-primary-600" aria-hidden />
        <span>A carregar carga horária…</span>
      </div>
    )
  }

  return (
    <div className="min-h-0 flex-1 space-y-6 bg-slate-50 p-4 md:p-6">
      {erro ? (
        <div
          className="rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-800"
          role="alert"
        >
          {erro}
        </div>
      ) : null}

      <header className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Gestão de Carga Horária
            </h1>
            <p className="mt-1.5 text-sm text-slate-600">
              Horas somadas a partir dos plantões na escala (Supabase), face à meta
              em «Contratação» do profissional.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="space-y-1.5">
              <label
                htmlFor={periodoId}
                className="block text-xs font-medium uppercase tracking-wide text-slate-500"
              >
                Período
              </label>
              <select
                id={periodoId}
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value as PeriodoCarga)}
                className={SELECT_CLASS}
              >
                <option value="mes-atual">Mês atual</option>
                <option value="semana-atual">Semana atual</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor={hospitalId}
                className="block text-xs font-medium uppercase tracking-wide text-slate-500"
              >
                Hospital / Setor
              </label>
              <select
                id={hospitalId}
                value={hospitalSetorFiltro}
                onChange={(e) => setHospitalSetorFiltro(e.target.value)}
                className={cn(SELECT_CLASS, 'min-w-64 max-w-full')}
              >
                <option value="todos">Todos</option>
                {opcoesHospitalSetor.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-5">
          {(
            [
              { id: 'todos' as const, label: 'Todos' },
              { id: 'ok' as const, label: 'Carga OK' },
              { id: 'alerta' as const, label: 'Em alerta' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFiltroRapido(tab.id)}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                filtroRapido === tab.id
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <section aria-label="Profissionais e metas">
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {listaFiltrada.map((p) => {
            const status = statusCarga(p)
            const pctDaMeta =
              p.horasMeta > 0 ? (p.horasAtuais / p.horasMeta) * 100 : 0
            const fillWidth = Math.min(100, pctDaMeta)

            return (
              <li key={p.id}>
                <article
                  className={cn(
                    'h-full rounded-xl border border-slate-100 bg-white p-5 shadow-sm',
                    status === 'danger' && 'ring-1 ring-danger-200',
                  )}
                >
                  <div className="flex gap-4">
                    {p.fotoUrl ? (
                      <img
                        src={p.fotoUrl}
                        alt=""
                        className="h-14 w-14 shrink-0 rounded-xl object-cover"
                      />
                    ) : (
                      <div
                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-sm font-semibold text-slate-700"
                        aria-hidden
                      >
                        {iniciais(p.nome)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h2 className="truncate font-semibold text-slate-900">
                            {p.nome}
                          </h2>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {p.especialidade}
                          </p>
                        </div>
                        {status === 'danger' ? (
                          <span
                            className="inline-flex shrink-0 rounded-lg bg-danger-50 p-1.5 text-danger-600"
                            title="Carga acima do limite crítico"
                          >
                            <AlertTriangle className="h-5 w-5" aria-hidden />
                            <span className="sr-only">Alerta: carga crítica</span>
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-xs text-slate-500 line-clamp-2">
                        {p.hospitalSetor}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="mb-2 flex items-baseline justify-between gap-2 text-sm">
                      <span className="font-medium text-slate-800">
                        {p.horasAtuais}h / {p.horasMeta}h{' '}
                        {periodo === 'mes-atual' ? 'meta mensal (≈4× semanal)' : 'contratadas (semana)'}
                      </span>
                      <span
                        className={cn(
                          'tabular-nums text-xs font-medium',
                          status === 'ok' && 'text-success-700',
                          status === 'warning' && 'text-warning-800',
                          status === 'danger' && 'text-danger-700',
                        )}
                      >
                        {Math.round(pctDaMeta)}% da meta
                      </span>
                    </div>
                    <div
                      className="h-3 w-full overflow-hidden rounded-full bg-slate-100"
                      role="presentation"
                    >
                      <div
                        className={cn(
                          'h-full rounded-full transition-[width] duration-500',
                          corBarra(status),
                        )}
                        style={{ width: `${fillWidth}%` }}
                      />
                    </div>
                  </div>
                </article>
              </li>
            )
          })}
        </ul>

        {listaFiltrada.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-600 shadow-sm">
            Nenhum profissional encontrado para os filtros selecionados.
          </div>
        ) : (
          <p className="text-center text-xs text-slate-500">
            Dados de {periodo === 'mes-atual' ? 'plantões do mês corrente' : 'plantões desta semana'}.
          </p>
        )}
      </section>
    </div>
  )
}
