import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  DollarSign,
  Loader2,
  Percent,
  ShieldCheck,
  SlidersHorizontal,
  TrendingUp,
} from 'lucide-react'
import { addDays, format, startOfYear } from 'date-fns'
import toast from 'react-hot-toast'

import { cn } from '../../lib/cn'
import { useCatalogoLocaisSetores } from '../../hooks/useCatalogoLocaisSetores'
import { useTenantUserId } from '../../hooks/useTenantUserId'
import { buscarPlantoesIntervaloComLocaisSetores } from '../../lib/dashboard/dashboardQueries'
import {
  agregarContagens48h,
  agregarDonutPeriodo,
  filtrarPorSetor,
  listarPlantoes48hParaPainel,
  listarTrocas48hParaPainel,
  listarVagos48hParaPainel,
  maximoSerieGrafico,
  serieMensalPlantoes,
  type FatiaDonutMes,
  type PontoGraficoMeses,
} from '../../lib/dashboard/resumoPainel'
import {
  calcularMetricasBi,
  custoPorSetorOrdenado,
  intervaloPeriodoBi,
  maximoSerieNumerica,
  META_MINIMA_COBERTURA_PADRAO,
  rankingProfissionaisPeriodo,
  rotuloPeriodoBi,
  serieCoberturaSemanal,
  type BarraSetorCusto,
  type LinhaRankingPeriodo,
  type PeriodoBi,
  type PontoSemanaCobertura,
} from '../../lib/dashboard/resumoBi'
import {
  aprovarCandidatura,
  buscarCandidaturasPendentes,
  filtrarCandidaturas48h,
  recusarCandidatura,
  type CandidaturaPendenteRow,
} from '../../lib/escalas/muralTrocasDb'
import { buscarRegrasRemuneracao } from '../../lib/financeiro/remuneracaoDb'
import { REGRAS_REMUNERACAO_VAZIAS } from '../../lib/financeiro/extratoCalculos'
import type { RegrasRemuneracao } from '../../lib/financeiro/remuneracaoTypes'
import type { PlantaoDashboardRow } from '../../lib/dashboard/dashboardQueries'

type PeriodoResumo = PeriodoBi

type Aba48h = 'furos' | 'anunciados' | 'trocas' | 'candidaturas'

const SELECT_CLASS =
  'min-w-[11rem] rounded-md border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm text-slate-700 shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'

const W = 640
const H = 220
const PAD = { l: 44, r: 16, t: 16, b: 36 }

function fmtBRL(n: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

function fmtPct(n: number): string {
  return `${n.toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`
}

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  const a = partes[0]?.[0] ?? ''
  const b = partes.length > 1 ? partes[partes.length - 1][0] : ''
  return (a + b).toUpperCase() || '?'
}

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
  filtros,
  filtrosAtivos = false,
}: {
  titulo: ReactNode
  children: ReactNode
  acaoTopo?: ReactNode
  filtros?: ReactNode
  filtrosAtivos?: boolean
}) {
  return (
    <div className="flex h-full min-h-0 flex-col ug-card shadow-ug transition-shadow duration-200 hover:shadow-md">
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="min-w-0">{titulo}</div>
        {acaoTopo ??
          (filtros ? (
            <BotaoFiltrosPopover filtrosAtivos={filtrosAtivos}>
              {filtros}
            </BotaoFiltrosPopover>
          ) : null)}
      </div>
      <div className="min-h-0 flex-1 px-5 py-4">{children}</div>
    </div>
  )
}

function BotaoFiltrosPopover({
  children,
  filtrosAtivos = false,
}: {
  children: ReactNode
  filtrosAtivos?: boolean
}) {
  const [aberto, setAberto] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const painelId = useId()

  useEffect(() => {
    if (!aberto) return

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const container = containerRef.current
      if (!container) return
      const target = event.target
      if (!(target instanceof Node)) return
      if (!container.contains(target)) setAberto(false)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAberto(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown, { passive: true })
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [aberto])

  return (
    <div className="relative shrink-0" ref={containerRef}>
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-controls={painelId}
        aria-haspopup="dialog"
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md border bg-white px-2.5 py-1.5 text-xs font-medium shadow-sm transition-colors',
          filtrosAtivos
            ? 'border-primary-300 text-primary-800 hover:border-primary-400 hover:bg-primary-50'
            : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50',
          aberto && 'border-primary-400 ring-2 ring-primary/20',
        )}
      >
        <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
        Filtros
        {filtrosAtivos ? (
          <span
            className="h-1.5 w-1.5 rounded-full bg-primary-600"
            aria-label="Filtros ativos"
          />
        ) : null}
      </button>

      {aberto ? (
        <div
          id={painelId}
          role="dialog"
          aria-label="Filtros do painel"
          className="absolute right-0 z-30 mt-2 w-72 ug-card p-4 shadow-xl shadow-slate-300/30 ring-1 ring-black/5"
        >
          {children}
        </div>
      ) : null}
    </div>
  )
}

function PainelFiltrosResumo({
  setor,
  onSetorChange,
  setoresOpcoes,
  periodo,
  onPeriodoChange,
  mostrarPeriodo = true,
}: {
  setor: string
  onSetorChange: (valor: string) => void
  setoresOpcoes: { id: string; nome: string }[]
  periodo: PeriodoResumo
  onPeriodoChange: (valor: PeriodoResumo) => void
  mostrarPeriodo?: boolean
}) {
  const idBase = useId()
  const idSetor = `${idBase}-setor`
  const idPeriodo = `${idBase}-periodo`

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor={idSetor} className="text-xs font-semibold text-slate-700">
          Setor
        </label>
        <select
          id={idSetor}
          className={cn(SELECT_CLASS, 'w-full min-w-0')}
          value={setor}
          onChange={(e) => onSetorChange(e.target.value)}
        >
          <option value="">Todos os setores</option>
          {setoresOpcoes.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nome}
            </option>
          ))}
        </select>
      </div>

      {mostrarPeriodo ? (
        <div className="space-y-1.5">
          <label htmlFor={idPeriodo} className="text-xs font-semibold text-slate-700">
            Período
          </label>
          <select
            id={idPeriodo}
            className={cn(SELECT_CLASS, 'w-full min-w-0')}
            value={periodo}
            onChange={(e) => onPeriodoChange(e.target.value as PeriodoResumo)}
          >
            <option value="mes">Mês atual</option>
            <option value="trimestre">Trimestre</option>
            <option value="ano">Ano corrente</option>
          </select>
        </div>
      ) : null}
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
    'bg-primary-600': 'var(--pc-600)',
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

function CardMetricaBi({
  titulo,
  valor,
  detalhe,
  icone: Icone,
  destaqueClass,
}: {
  titulo: string
  valor: string
  detalhe: string
  icone: typeof DollarSign
  destaqueClass: string
}) {
  return (
    <article className="ug-card p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {titulo}
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-slate-900">
            {valor}
          </p>
          <p className="mt-1 text-xs text-slate-500">{detalhe}</p>
        </div>
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
            destaqueClass,
          )}
        >
          <Icone className="h-5 w-5" aria-hidden />
        </div>
      </div>
    </article>
  )
}

function GraficoBarrasSetor({
  barras,
  yMax,
}: {
  barras: BarraSetorCusto[]
  yMax: number
}) {
  const innerW = W - PAD.l - PAD.r
  const innerH = H - PAD.t - PAD.b
  const barWidth = barras.length > 0 ? innerW / barras.length * 0.55 : 0
  const gap = barras.length > 0 ? innerW / barras.length : 0

  return (
    <div className="w-full overflow-x-auto">
      {barras.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">
          Sem plantões realizados no período.
        </p>
      ) : (
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full min-w-70 text-slate-400"
          role="img"
          aria-label="Custo por setor"
        >
          <line
            x1={PAD.l}
            y1={escalaY(0, yMax)}
            x2={W - PAD.r}
            y2={escalaY(0, yMax)}
            className="stroke-slate-200"
            strokeWidth={1}
          />
          {barras.map((barra, i) => {
            const xCenter = PAD.l + gap * i + gap / 2
            const barH = (barra.custo / yMax) * innerH
            const yTop = PAD.t + innerH - barH
            return (
              <g key={barra.setorId}>
                <rect
                  x={xCenter - barWidth / 2}
                  y={yTop}
                  width={barWidth}
                  height={barH}
                  rx={3}
                  className="fill-primary-500"
                />
                <text
                  x={xCenter}
                  y={H - 8}
                  textAnchor="middle"
                  className="fill-slate-500 text-[9px] font-medium"
                >
                  {barra.setorNome.length > 10
                    ? `${barra.setorNome.slice(0, 9)}…`
                    : barra.setorNome}
                </text>
              </g>
            )
          })}
        </svg>
      )}
    </div>
  )
}

function GraficoCoberturaSemanal({
  pontos,
  yMax,
}: {
  pontos: PontoSemanaCobertura[]
  yMax: number
}) {
  const serieConfirmados = pontos.map((p) => p.confirmados)
  const serieFuros = pontos.map((p) => p.furos)
  const n = pontos.length

  return (
    <div className="w-full overflow-x-auto">
      {pontos.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">
          Sem dados de cobertura no período.
        </p>
      ) : (
        <>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="h-auto w-full min-w-70 text-slate-400"
            role="img"
            aria-label="Evolução semanal: confirmados vs furos"
          >
            <line
              x1={PAD.l}
              y1={escalaY(0, yMax)}
              x2={W - PAD.r}
              y2={escalaY(0, yMax)}
              className="stroke-slate-200"
              strokeWidth={1}
            />
            <path
              d={pathLinha(serieConfirmados, yMax)}
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
                className="fill-slate-500 text-[10px] font-medium"
              >
                {p.rotulo}
              </text>
            ))}
          </svg>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-slate-600">
            <span className="inline-flex items-center gap-2">
              <span className="h-0.5 w-6 bg-success-600" aria-hidden />
              Confirmados
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-0.5 w-6 bg-danger-500" aria-hidden />
              Furos
            </span>
          </div>
        </>
      )}
    </div>
  )
}

function RankingProfissionaisAtivos({
  ranking,
}: {
  ranking: LinhaRankingPeriodo[]
}) {
  if (ranking.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-slate-500">
        Sem profissionais com plantões no período.
      </p>
    )
  }

  const maxHoras = Math.max(1, ...ranking.map((r) => r.horasNum))

  return (
    <ul className="space-y-3">
      {ranking.map((row) => {
        const pctBarra = (row.horasNum / maxHoras) * 100
        return (
          <li
            key={row.profissionalId}
            className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2.5"
          >
            <span
              className="w-5 shrink-0 text-sm font-bold tabular-nums text-slate-400"
              aria-hidden
            >
              {row.n}.
            </span>
            {row.fotoUrl ? (
              <img
                src={row.fotoUrl}
                alt=""
                className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-white"
              />
            ) : (
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-800"
                aria-hidden
              >
                {iniciais(row.nome)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-slate-900">{row.nome}</p>
              <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-500">
                <span className="tabular-nums">
                  {row.realizados} plantões
                </span>
                <span className="tabular-nums font-medium text-slate-700">
                  {row.horas}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-primary-500 transition-all"
                  style={{ width: `${pctBarra}%` }}
                />
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function ListaCandidaturas48h({
  candidaturas,
  carregando,
  processandoId,
  onAprovar,
  onRecusar,
  mensagemVazia = 'Sem candidaturas pendentes neste intervalo.',
}: {
  candidaturas: CandidaturaPendenteRow[]
  carregando: boolean
  processandoId: string | null
  onAprovar: (candidatura: CandidaturaPendenteRow) => Promise<void>
  onRecusar: (candidatura: CandidaturaPendenteRow) => Promise<void>
  mensagemVazia?: string
}) {
  if (carregando) {
    return (
      <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Carregando candidaturas…
      </div>
    )
  }

  if (candidaturas.length === 0) {
    return (
      <p className="text-sm font-medium text-slate-500">{mensagemVazia}</p>
    )
  }

  return (
    <ul className="w-full max-w-lg space-y-3 px-1 text-left text-sm">
      {candidaturas.map((c) => {
        const horario = `${c.horaInicio.slice(0, 5)}–${c.horaFim.slice(0, 5)}`
        const processando = processandoId === c.id

        return (
          <li
            key={c.id}
            className="ug-card px-3 py-3 shadow-sm"
          >
            <p className="font-semibold text-slate-900">{c.candidatoNome}</p>
            <p className="mt-0.5 text-xs text-slate-500">
              {c.dataPlantao} · {horario} · {c.setorNome} · {c.localNome}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Substituindo {c.anuncianteNome}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={processando}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-success-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-success-700 disabled:opacity-60"
                onClick={() => void onAprovar(c)}
              >
                {processando ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                ) : null}
                Aprovar
              </button>
              <button
                type="button"
                disabled={processando}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-danger-200 bg-white px-3 py-2 text-sm font-semibold text-danger-700 shadow-sm transition-colors hover:bg-danger-50 disabled:opacity-60"
                onClick={() => void onRecusar(c)}
              >
                {processando ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                ) : null}
                Recusar
              </button>
            </div>
          </li>
        )
      })}
    </ul>
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
  const { user, tenantUserId, isLoading: isLoadingUser, isMembroProfissional } =
    useTenantUserId()
  const { setores } = useCatalogoLocaisSetores()
  const [periodo, setPeriodo] = useState<PeriodoResumo>('mes')
  const [setor, setSetor] = useState('')
  const [aba48h, setAba48h] = useState<Aba48h>('anunciados')
  const [plantoesRaw, setPlantoesRaw] = useState<PlantaoDashboardRow[]>([])
  const setoresOpcoes = useMemo(
    () => setores.map((item) => ({ id: item.id, nome: item.nome })),
    [setores],
  )
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [candidaturasPendentes, setCandidaturasPendentes] = useState<CandidaturaPendenteRow[]>(
    [],
  )
  const [carregandoCandidaturas, setCarregandoCandidaturas] = useState(false)
  const [processandoSolicitacaoId, setProcessandoSolicitacaoId] = useState<string | null>(
    null,
  )
  const [regrasRemuneracao, setRegrasRemuneracao] = useState<RegrasRemuneracao>(
    REGRAS_REMUNERACAO_VAZIAS,
  )

  const recarregarCandidaturas = useCallback(async () => {
    if (!tenantUserId) return
    setCarregandoCandidaturas(true)
    try {
      const rows = await buscarCandidaturasPendentes(tenantUserId)
      setCandidaturasPendentes(rows)
    } catch {
      setCandidaturasPendentes([])
    } finally {
      setCarregandoCandidaturas(false)
    }
  }, [tenantUserId])

  const aprovarCandidaturaHandler = useCallback(
    async (candidatura: CandidaturaPendenteRow) => {
      setProcessandoSolicitacaoId(candidatura.id)
      try {
        await aprovarCandidatura(
          candidatura.id,
          candidatura.plantaoId,
          candidatura.candidatoProfissionalId,
        )
        toast.success('Troca de plantão efetivada com sucesso!')
        setCandidaturasPendentes((prev) => prev.filter((x) => x.id !== candidatura.id))
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao aprovar candidatura.')
      } finally {
        setProcessandoSolicitacaoId(null)
      }
    },
    [],
  )

  const recusarCandidaturaHandler = useCallback(async (candidatura: CandidaturaPendenteRow) => {
    setProcessandoSolicitacaoId(candidatura.id)
    try {
      await recusarCandidatura(candidatura.id)
      toast.success('Candidatura recusada.')
      setCandidaturasPendentes((prev) => prev.filter((x) => x.id !== candidatura.id))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao recusar candidatura.')
    } finally {
      setProcessandoSolicitacaoId(null)
    }
  }, [])

  useEffect(() => {
    if (isLoadingUser || !user || !tenantUserId) return
    const userId = tenantUserId
    let cancelado = false

    async function load() {
      setCarregando(true)
      setErro(null)
      try {
        const hoje = new Date()
        const min = format(startOfYear(hoje), 'yyyy-MM-dd')
        const max = format(addDays(hoje, 2), 'yyyy-MM-dd')
        const [plantoes, regras] = await Promise.all([
          buscarPlantoesIntervaloComLocaisSetores(userId, min, max),
          buscarRegrasRemuneracao(userId).catch(() => REGRAS_REMUNERACAO_VAZIAS),
        ])
        if (cancelado) return
        setPlantoesRaw(plantoes)
        setRegrasRemuneracao(regras)
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
  }, [user, isLoadingUser, tenantUserId])

  useEffect(() => {
    if (isLoadingUser || !tenantUserId || isMembroProfissional) return
    void recarregarCandidaturas()
  }, [isLoadingUser, isMembroProfissional, tenantUserId, recarregarCandidaturas])

  const agora = useMemo(() => new Date(), [plantoesRaw])

  const intervaloBi = useMemo(
    () => intervaloPeriodoBi(periodo, agora),
    [periodo, agora],
  )

  const plantoesFiltrados = useMemo(
    () => filtrarPorSetor(plantoesRaw, setor),
    [plantoesRaw, setor],
  )

  const metricasBi = useMemo(
    () =>
      calcularMetricasBi(
        plantoesFiltrados,
        intervaloBi,
        regrasRemuneracao,
        META_MINIMA_COBERTURA_PADRAO,
      ),
    [plantoesFiltrados, intervaloBi, regrasRemuneracao],
  )

  const barrasSetor = useMemo(
    () =>
      custoPorSetorOrdenado(plantoesFiltrados, intervaloBi, regrasRemuneracao),
    [plantoesFiltrados, intervaloBi, regrasRemuneracao],
  )

  const yMaxBarrasSetor = useMemo(
    () => maximoSerieNumerica(barrasSetor.map((b) => b.custo)),
    [barrasSetor],
  )

  const serieSemanal = useMemo(
    () => serieCoberturaSemanal(plantoesFiltrados, intervaloBi),
    [plantoesFiltrados, intervaloBi],
  )

  const yMaxSemanal = useMemo(() => {
    const vals = serieSemanal.flatMap((p) => [p.confirmados, p.furos])
    return maximoSerieNumerica(vals)
  }, [serieSemanal])

  const rankingPeriodo = useMemo(
    () => rankingProfissionaisPeriodo(plantoesFiltrados, intervaloBi, 5),
    [plantoesFiltrados, intervaloBi],
  )

  const rotuloPeriodo = rotuloPeriodoBi(periodo)

  const filtrosAtivosSetor = setor !== ''
  const filtrosAtivosPeriodo = periodo !== 'mes'
  const filtrosAtivosCompletos = filtrosAtivosSetor || filtrosAtivosPeriodo

  const painelFiltrosCompleto = (
    <PainelFiltrosResumo
      setor={setor}
      onSetorChange={setSetor}
      setoresOpcoes={setoresOpcoes}
      periodo={periodo}
      onPeriodoChange={setPeriodo}
    />
  )

  const painelFiltrosSomenteSetor = (
    <PainelFiltrosResumo
      setor={setor}
      onSetorChange={setSetor}
      setoresOpcoes={setoresOpcoes}
      periodo={periodo}
      onPeriodoChange={setPeriodo}
      mostrarPeriodo={false}
    />
  )

  const candidaturasFiltradas = useMemo(() => {
    const noSetor = setor
      ? candidaturasPendentes.filter((c) => c.setorId === setor)
      : candidaturasPendentes
    return filtrarCandidaturas48h(noSetor, agora)
  }, [candidaturasPendentes, setor, agora])

  const contagem48h = useMemo(
    () =>
      agregarContagens48h(
        plantoesFiltrados,
        agora,
        candidaturasFiltradas.length,
      ),
    [plantoesFiltrados, agora, candidaturasFiltradas.length],
  )

  const listaAnunciados = useMemo(
    () => listarPlantoes48hParaPainel(plantoesFiltrados, agora),
    [plantoesFiltrados, agora],
  )

  const listaFuros = useMemo(
    () => listarVagos48hParaPainel(plantoesFiltrados, agora),
    [plantoesFiltrados, agora],
  )

  const listaTrocas48h = useMemo(
    () => listarTrocas48hParaPainel(plantoesFiltrados, agora),
    [plantoesFiltrados, agora],
  )

  const donut = useMemo(
    () =>
      agregarDonutPeriodo(
        plantoesFiltrados,
        intervaloBi.inicio,
        intervaloBi.fim,
      ),
    [plantoesFiltrados, intervaloBi],
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
    if (aba48h === 'trocas') return <ListaItens48h itens={listaTrocas48h} />
    return (
      <ListaCandidaturas48h
        candidaturas={candidaturasFiltradas}
        carregando={carregandoCandidaturas}
        processandoId={processandoSolicitacaoId}
        onAprovar={aprovarCandidaturaHandler}
        onRecusar={recusarCandidaturaHandler}
      />
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
    <div className="mx-auto w-full max-w-7xl space-y-6 bg-ug-bg">
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
            <h1 className="ug-page-title text-2xl">
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
                <option value="mes">Mês atual</option>
                <option value="trimestre">Trimestre</option>
                <option value="ano">Ano corrente</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <section aria-label="Indicadores estratégicos" className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <CardMetricaBi
            titulo="Custo total de escala"
            valor={fmtBRL(metricasBi.custoTotalEscala)}
            detalhe="Plantões realizados no período (líquido de ajustes)"
            icone={DollarSign}
            destaqueClass="bg-primary-50 text-primary-700"
          />
          <CardMetricaBi
            titulo="Taxa de absenteísmo / glosas"
            valor={fmtPct(metricasBi.taxaGlosasPct)}
            detalhe={`${fmtBRL(metricasBi.totalGlosas)} em glosas sobre ${fmtBRL(metricasBi.totalBrutoEscala)} bruto`}
            icone={Percent}
            destaqueClass="bg-danger-50 text-danger-600"
          />
          <CardMetricaBi
            titulo="Eficiência de cobertura"
            valor={fmtPct(metricasBi.eficienciaCoberturaPct)}
            detalhe={`${metricasBi.diasComMeta} de ${metricasBi.diasAvaliados} dias-setor com meta mínima (${META_MINIMA_COBERTURA_PADRAO} plantonistas)`}
            icone={ShieldCheck}
            destaqueClass="bg-success-50 text-success-700"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <CardShell
            titulo={
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Análise financeira
                </p>
                <h2 className="text-base font-semibold text-slate-900">
                  Custo por setor
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Plantões realizados no {rotuloPeriodo}, do mais caro ao mais barato.
                </p>
              </div>
            }
            filtros={painelFiltrosCompleto}
            filtrosAtivos={filtrosAtivosCompletos}
          >
            <GraficoBarrasSetor barras={barrasSetor} yMax={yMaxBarrasSetor} />
          </CardShell>

          <CardShell
            titulo={
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Cobertura operacional
                </p>
                <h2 className="text-base font-semibold text-slate-900">
                  Evolução semanal
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Confirmados vs. furos por semana no {rotuloPeriodo}.
                </p>
              </div>
            }
            filtros={painelFiltrosCompleto}
            filtrosAtivos={filtrosAtivosCompletos}
          >
            <GraficoCoberturaSemanal pontos={serieSemanal} yMax={yMaxSemanal} />
          </CardShell>
        </div>

        <CardShell
          titulo={
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary-600" aria-hidden />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Ranking
                </p>
                <h2 className="text-base font-semibold text-slate-900">
                  Profissionais mais ativos
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Top 5 no {rotuloPeriodo} — plantões e carga horária.
                </p>
              </div>
            </div>
          }
          filtros={painelFiltrosCompleto}
          filtrosAtivos={filtrosAtivosCompletos}
        >
          <RankingProfissionaisAtivos ranking={rankingPeriodo} />
        </CardShell>
      </section>

      {!isMembroProfissional ? (
        <CardShell
          titulo={
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Coordenação
              </p>
              <h2 className="text-base font-semibold text-slate-900">Trocas pendentes</h2>
              <p className="mt-1 text-xs text-slate-500">
                Aprovações para repasse de plantões anunciados no mural.
              </p>
            </div>
          }
          acaoTopo={
            <button
              type="button"
              onClick={() => void recarregarCandidaturas()}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50"
            >
              {carregandoCandidaturas ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              ) : null}
              Atualizar
            </button>
          }
        >
          <ListaCandidaturas48h
            candidaturas={candidaturasPendentes}
            carregando={carregandoCandidaturas}
            processandoId={processandoSolicitacaoId}
            onAprovar={aprovarCandidaturaHandler}
            onRecusar={recusarCandidaturaHandler}
            mensagemVazia="Nenhuma troca pendente."
          />
        </CardShell>
      ) : null}

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
          filtros={painelFiltrosSomenteSetor}
          filtrosAtivos={filtrosAtivosSetor}
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
                {rotuloPeriodo}
              </span>
            </h2>
          }
          filtros={painelFiltrosCompleto}
          filtrosAtivos={filtrosAtivosCompletos}
        >
          <DonutTiposPlantao
            fatias={donut.fatias}
            totalPlantoes={donut.totalPlantoes}
          />
        </CardShell>

        <CardShell
          titulo={
            <h2 className="text-sm font-semibold leading-snug text-slate-800">
              <span className="text-slate-500">Histórico — </span>
              <span className="uppercase tracking-wide text-slate-900">
                últimos 7 meses
              </span>
            </h2>
          }
          filtros={painelFiltrosSomenteSetor}
          filtrosAtivos={filtrosAtivosSetor}
        >
          <p className="mb-3 text-xs text-slate-500">
            Visão histórica independente do filtro de período (total, coberturas e furos).
            Eixo até {yMaxGrafico} plantões.
          </p>
          <GraficoPlantoesPeriodo pontos={pontosGrafico} yMax={yMaxGrafico} />
        </CardShell>
      </div>
    </div>
  )
}
