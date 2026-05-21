import { useEffect, useId, useMemo, useState, type ReactNode } from 'react'
import { Filter, Loader2, SlidersHorizontal } from 'lucide-react'
import { addDays, format, startOfMonth, subMonths } from 'date-fns'

import { cn } from '../../lib/cn'
import { useSupabaseUser } from '../../hooks/useSupabaseUser'
import { buscarPlantoesIntervaloComLocaisSetores } from '../../lib/dashboard/dashboardQueries'
import {
  agregarContagens48h,
  agregarDonutMesAnterior,
  filtrarPorSetor,
  listarPlantoes48hParaPainel,
  listarVagos48hParaPainel,
  maximoSerieGrafico,
  rankingProfissionaisSemana,
  serieMensalPlantoes,
  type FatiaDonutMes,
  type PontoGraficoMeses,
} from '../../lib/dashboard/resumoPainel'
import { buscarSetoresEscala } from '../../lib/escalas/plantoesDb'
import type { PlantaoDashboardRow } from '../../lib/dashboard/dashboardQueries'

type PeriodoResumo = 'hoje' | 'semana' | 'mes'

type Aba48h = 'furos' | 'anunciados' | 'trocas' | 'candidaturas'

const SELECT_CLASS =
  'min-w-[11rem] rounded-md border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm text-slate-700 shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'

const W = 640
const H = 220
const PAD = { l: 44, r: 16, t: 16, b: 36 }

function escalaY(v: number, yMax: number) {
  const innerH = H - PAD.t - PAD.b
  return PAD.t + innerH * (1 - v / yMax)
}

function escalaX(i: number, totalPontos: number) {
  const innerW = W - PAD.l - PAD.r
  const n = Math.max(1, totalPontos - 1)
  return PAD.l + (innerW * i) / n
}

function pathLinha(valores: number[], yMax: number) {
  return valores
    .map(
      (v, i) =>
        `${i === 0 ? 'M' : 'L'} ${escalaX(i, valores.length)} ${escalaY(v, yMax)}`,
    )
    .join(' ')
}

function pathArea(valores: number[], yMax: number) {
  const baseY = escalaY(0, yMax)
  const primeiro = `M ${escalaX(0, valores.length)} ${baseY} L ${escalaX(0, valores.length)} ${escalaY(valores[0] ?? 0, yMax)}`
  const meio = valores
    .map((v, i) => `L ${escalaX(i, valores.length)} ${escalaY(v, yMax)}`)
    .join(' ')
  const ultimo = `L ${escalaX(valores.length - 1, valores.length)} ${baseY} Z`
  return `${primeiro} ${meio} ${ultimo}`
}

function CardShell({
  titulo,
  children,
  acaoTopo,
}: {
  titulo: ReactNode
  children: ReactNode
  acaoTopo?: ReactNode
}) {
  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-slate-100 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md">
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="min-w-0">{titulo}</div>
        {acaoTopo ?? (
          <button
            type="button"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
            Filtros
          </button>
        )}
      </div>
      <div className="min-h-0 flex-1 px-5 py-4">{children}</div>
    </div>
  )
}

function DonutTiposPlantao({
  fatias,
  totalPlantoes,
}: {
  fatias: FatiaDonutMes[]
  totalPlantoes: number
}) {
  const corHexPorClasse: Record<string, string> = {
    'bg-slate-300': '#cbd5e1',
    'bg-warning-500': '#f97316',
    'bg-primary-600': '#2563eb',
  }

  let acum = 0
  const sumTipos = Math.max(
    1,
    fatias.reduce((acc, f) => acc + f.total, 0),
  )
  const stops = fatias
    .map((f) => {
      const frac = f.total / sumTipos
      const ini = acum * 360
      acum += frac
      const fim = acum * 360
      const cor = corHexPorClasse[f.cor] ?? '#94a3b8'
      return `${cor} ${ini}deg ${fim}deg`
    })
    .join(', ')

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-center sm:gap-10">
      <div className="relative h-44 w-44 shrink-0">
        <div
          className="absolute inset-0 rounded-full"
          style={{ background: `conic-gradient(${stops})` }}
          aria-hidden
        />
        <div className="absolute inset-8 rounded-full bg-white shadow-inner ring-1 ring-slate-100" />
        <div className="absolute inset-0 flex items-center justify-center pt-1">
          <span className="text-center text-xs font-medium text-slate-500">
            Total
            <br />
            <span className="text-lg font-bold tabular-nums text-slate-800">
              {totalPlantoes}
            </span>
          </span>
        </div>
      </div>

      <div className="w-full min-w-0 sm:max-w-xs">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="pb-2 font-medium">Tipo</th>
              <th className="pb-2 text-right font-medium">Total</th>
              <th className="pb-2 text-right font-medium">Furos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {fatias.map((row) => (
              <tr key={row.tipo} className="text-slate-700">
                <td className="py-2.5 pr-2">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className={cn('h-2.5 w-2.5 shrink-0 rounded-sm', row.cor)}
                      aria-hidden
                    />
                    {row.tipo}
                  </span>
                </td>
                <td className="py-2.5 text-right tabular-nums font-medium text-slate-900">
                  {row.total}
                </td>
                <td className="py-2.5 text-right tabular-nums text-danger-600">
                  {row.furos}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function GraficoPlantoesPeriodo({
  pontos,
  yMax,
}: {
  pontos: PontoGraficoMeses[]
  yMax: number
}) {
  const serieTotal = pontos.map((p) => p.total)
  const serieCoberturas = pontos.map((p) => p.coberturas)
  const serieFuros = pontos.map((p) => p.furos)
  const n = pontos.length
  const ticks = [1, 2, 3].map((k) => Math.round((yMax * k) / 4))

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full min-w-70 text-slate-400"
        role="img"
        aria-label="Plantões por período: coberturas, furos e total"
      >
        <line
          x1={PAD.l}
          y1={escalaY(0, yMax)}
          x2={W - PAD.r}
          y2={escalaY(0, yMax)}
          className="stroke-slate-200"
          strokeWidth={1}
        />
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={PAD.l}
              y1={escalaY(tick, yMax)}
              x2={W - PAD.r}
              y2={escalaY(tick, yMax)}
              className="stroke-slate-100"
              strokeWidth={1}
              strokeDasharray="4 4"
            />
            <text
              x={PAD.l - 8}
              y={escalaY(tick, yMax)}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-slate-400 text-[10px] tabular-nums"
            >
              {tick}
            </text>
          </g>
        ))}
        <text
          x={PAD.l - 8}
          y={escalaY(0, yMax)}
          textAnchor="end"
          dominantBaseline="middle"
          className="fill-slate-400 text-[10px] tabular-nums"
        >
          0
        </text>

        <path
          d={pathArea(serieTotal, yMax)}
          className="fill-primary-200/40 stroke-none"
        />
        <path
          d={pathArea(serieCoberturas, yMax)}
          className="fill-success-200/55 stroke-none"
        />

        <path
          d={pathLinha(serieTotal, yMax)}
          fill="none"
          className="stroke-primary-600"
          strokeWidth={2}
          strokeLinejoin="round"
        />
        <path
          d={pathLinha(serieCoberturas, yMax)}
          fill="none"
          className="stroke-success-600"
          strokeWidth={2}
          strokeLinejoin="round"
        />

        <path
          d={pathLinha(serieFuros, yMax)}
          fill="none"
          className="stroke-danger-500"
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {pontos.map((p, i) => (
          <text
            key={p.chave}
            x={escalaX(i, n)}
            y={H - 10}
            textAnchor="middle"
            className="fill-slate-500 text-[10px] font-medium capitalize"
          >
            {p.rotulo}
          </text>
        ))}
      </svg>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-slate-600">
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-6 rounded-sm bg-success-500" aria-hidden />
          Coberturas
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-0.5 w-6 bg-danger-500" aria-hidden />
          Furos
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-6 rounded-sm bg-primary-500" aria-hidden />
          Total de plantões
        </span>
      </div>
    </div>
  )
}

function ListaItens48h({
  itens,
}: {
  itens: { id: string; titulo: string; local: string; inicioRelativo: string }[]
}) {
  if (itens.length === 0) {
    return (
      <p className="text-sm font-medium text-slate-500">
        Sem resultados neste intervalo.
      </p>
    )
  }
  return (
    <ul className="w-full max-w-lg space-y-2 px-1 text-left text-sm">
      {itens.map((p) => (
        <li
          key={p.id}
          className="flex flex-col gap-0.5 rounded-lg border border-slate-100 bg-white px-3 py-2.5 shadow-sm transition-colors hover:border-primary-200 hover:bg-primary-50/30 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="font-medium text-slate-900">{p.titulo}</p>
            <p className="text-xs text-slate-500">{p.local}</p>
          </div>
          <span className="shrink-0 text-xs font-medium tabular-nums text-primary-700 sm:text-sm">
            {p.inicioRelativo}
          </span>
        </li>
      ))}
    </ul>
  )
}

export function ResumoPage() {
  const idPeriodo = useId()
  const idSetor = useId()
  const { user, isLoading: isLoadingUser } = useSupabaseUser()
  const [periodo, setPeriodo] = useState<PeriodoResumo>('mes')
  const [setor, setSetor] = useState('')
  const [aba48h, setAba48h] = useState<Aba48h>('anunciados')
  const [plantoesRaw, setPlantoesRaw] = useState<PlantaoDashboardRow[]>([])
  const [setoresOpcoes, setSetoresOpcoes] = useState<{ id: string; nome: string }[]>(
    [],
  )
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (isLoadingUser || !user) return
    const userId = user.id
    let cancelado = false

    async function load() {
      setCarregando(true)
      setErro(null)
      try {
        const hoje = new Date()
        const min = format(startOfMonth(subMonths(hoje, 6)), 'yyyy-MM-dd')
        const max = format(addDays(hoje, 2), 'yyyy-MM-dd')
        const [plantoes, setores] = await Promise.all([
          buscarPlantoesIntervaloComLocaisSetores(userId, min, max),
          buscarSetoresEscala(userId),
        ])
        if (cancelado) return
        setPlantoesRaw(plantoes)
        setSetoresOpcoes(setores.map((s) => ({ id: s.id, nome: s.nome })))
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
  }, [user, isLoadingUser])

  const agora = useMemo(() => new Date(), [plantoesRaw])

  const plantoesFiltrados = useMemo(
    () => filtrarPorSetor(plantoesRaw, setor),
    [plantoesRaw, setor],
  )

  const contagem48h = useMemo(
    () => agregarContagens48h(plantoesFiltrados, agora),
    [plantoesFiltrados, agora],
  )

  const listaAnunciados = useMemo(
    () => listarPlantoes48hParaPainel(plantoesFiltrados, agora),
    [plantoesFiltrados, agora],
  )

  const listaFuros = useMemo(
    () => listarVagos48hParaPainel(plantoesFiltrados, agora),
    [plantoesFiltrados, agora],
  )

  const donut = useMemo(
    () => agregarDonutMesAnterior(plantoesFiltrados, agora),
    [plantoesFiltrados, agora],
  )

  const ranking = useMemo(
    () => rankingProfissionaisSemana(plantoesFiltrados, agora),
    [plantoesFiltrados, agora],
  )

  const pontosGrafico = useMemo(
    () => serieMensalPlantoes(plantoesFiltrados, agora, 7),
    [plantoesFiltrados, agora],
  )

  const yMaxGrafico = useMemo(
    () => maximoSerieGrafico(pontosGrafico),
    [pontosGrafico],
  )

  const abas48h: {
    id: Aba48h
    rotulo: string
    count: number
    countClass: string
    activeClass: string
  }[] = [
    {
      id: 'furos',
      rotulo: 'Furos não anunciados',
      count: contagem48h.furos,
      countClass: 'text-danger-600',
      activeClass: 'border-danger-500 text-danger-700',
    },
    {
      id: 'anunciados',
      rotulo: 'Plantões anunciados',
      count: contagem48h.anunciados,
      countClass: 'text-warning-600',
      activeClass: 'border-warning-500 text-warning-800',
    },
    {
      id: 'trocas',
      rotulo: 'Trocas e passagens pendentes',
      count: contagem48h.trocas,
      countClass: 'text-primary-700',
      activeClass: 'border-primary-500 text-primary-900',
    },
    {
      id: 'candidaturas',
      rotulo: 'Candidaturas pendentes',
      count: contagem48h.candidaturas,
      countClass: 'text-primary-700',
      activeClass: 'border-primary-500 text-primary-900',
    },
  ]

  const painel48h = () => {
    if (aba48h === 'anunciados') return <ListaItens48h itens={listaAnunciados} />
    if (aba48h === 'furos') return <ListaItens48h itens={listaFuros} />
    return (
      <p className="text-sm font-medium text-slate-500">
        Sem integração — em breve no fluxo de trocas e candidaturas.
      </p>
    )
  }

  if (isLoadingUser || (carregando && plantoesRaw.length === 0 && !erro)) {
    return (
      <div className="mx-auto flex min-h-[40vh] max-w-7xl items-center justify-center gap-2 text-slate-600">
        <Loader2 className="h-6 w-6 animate-spin text-primary-600" aria-hidden />
        <span>A carregar plantões…</span>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 bg-slate-50">
      {erro ? (
        <div
          className="rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-800"
          role="alert"
        >
          {erro}
        </div>
      ) : null}

      <header className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary-700">
              Painel de controle
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Resumo
            </h1>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor={idSetor} className="text-sm text-slate-600">
                Setores
              </label>
              <select
                id={idSetor}
                className={SELECT_CLASS}
                value={setor}
                onChange={(e) => setSetor(e.target.value)}
                aria-label="Filtrar por setor"
              >
                <option value="">Todos os setores</option>
                {setoresOpcoes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor={idPeriodo} className="text-sm text-slate-600">
                Período
              </label>
              <select
                id={idPeriodo}
                className={SELECT_CLASS}
                value={periodo}
                onChange={(e) =>
                  setPeriodo(e.target.value as PeriodoResumo)
                }
                aria-label="Período do painel"
              >
                <option value="hoje">Hoje</option>
                <option value="semana">Esta semana</option>
                <option value="mes">Este mês</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CardShell
          titulo={
            <h2 className="text-sm font-semibold leading-snug text-slate-800">
              <span className="text-slate-500">Próximas ações nas </span>
              <span className="uppercase tracking-wide text-slate-900">
                próximas 48 horas
              </span>
            </h2>
          }
        >
          <div className="-mx-5 -mt-4 border-b border-slate-100">
            <div
              className="flex flex-wrap"
              role="tablist"
              aria-label="Resumo das próximas 48 horas"
            >
              {abas48h.map((aba) => {
                const ativo = aba48h === aba.id
                return (
                  <button
                    key={aba.id}
                    type="button"
                    role="tab"
                    aria-selected={ativo}
                    onClick={() => setAba48h(aba.id)}
                    className={cn(
                      'min-w-0 flex-1 basis-0 border-b-2 px-2 py-3 text-center transition-colors sm:px-3',
                      ativo
                        ? cn('border-current bg-slate-50/80', aba.activeClass)
                        : 'border-transparent text-slate-500 hover:bg-slate-50/60 hover:text-slate-700',
                    )}
                  >
                    <span className="block text-[11px] font-medium leading-tight sm:text-xs">
                      {aba.rotulo}
                    </span>
                    <span
                      className={cn(
                        'mt-1 block text-xl font-bold tabular-nums sm:text-2xl',
                        ativo ? aba.countClass : 'text-slate-400',
                      )}
                    >
                      {aba.count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50 py-10">
            {painel48h()}
          </div>
        </CardShell>

        <CardShell
          titulo={
            <h2 className="text-sm font-semibold leading-snug text-slate-800">
              <span className="text-slate-500">Tipos de plantão no </span>
              <span className="uppercase tracking-wide text-slate-900">
                mês anterior
              </span>
            </h2>
          }
        >
          <DonutTiposPlantao
            fatias={donut.fatias}
            totalPlantoes={donut.totalPlantoes}
          />
        </CardShell>

        <CardShell
          titulo={
            <h2 className="text-sm font-semibold leading-snug text-slate-800">
              <span className="text-slate-500">Profissionais </span>
              <span className="uppercase tracking-wide text-slate-900">
                nesta semana
              </span>
            </h2>
          }
        >
          <div className="-mx-5 -mt-4 max-h-[min(24rem,55vh)] overflow-auto rounded-lg border border-slate-100">
            <table className="w-full min-w-[320px] text-left text-sm">
              <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 text-right font-medium">
                    Realizados
                  </th>
                  <th className="px-4 py-3 text-right font-medium">Horas</th>
                  <th className="px-4 py-3 text-right font-medium">
                    Coberturas
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {ranking.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-6 text-center text-sm text-slate-500"
                    >
                      Sem plantões atribuídos esta semana.
                    </td>
                  </tr>
                ) : (
                  ranking.map((row) => (
                    <tr
                      key={row.profissionalId}
                      className="transition-colors hover:bg-slate-50/80"
                    >
                      <td className="px-4 py-2.5">
                        <span className="mr-2 inline-block w-5 tabular-nums text-slate-400">
                          {row.n}.
                        </span>
                        <span className="font-medium text-slate-900">
                          {row.nome}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">
                        {row.realizados}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">
                        {row.horas}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums font-medium text-primary-700">
                        {row.coberturas}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardShell>

        <CardShell
          titulo={
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" aria-hidden />
              <h2 className="text-sm font-semibold text-slate-800">
                Plantões por período
              </h2>
            </div>
          }
        >
          <p className="mb-3 text-xs text-slate-500">
            Séries dos últimos 7 meses (total, coberturas sem vagos, furos). Recorte
            visível no painel:{' '}
            {periodo === 'hoje'
              ? 'hoje'
              : periodo === 'semana'
                ? 'esta semana'
                : 'este mês'}
            . Eixo até {yMaxGrafico} plantões.
          </p>
          <GraficoPlantoesPeriodo pontos={pontosGrafico} yMax={yMaxGrafico} />
        </CardShell>
      </div>
    </div>
  )
}
