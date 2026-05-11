import { useId, useState, type ReactNode } from 'react'
import { Filter, SlidersHorizontal } from 'lucide-react'

import { cn } from '../../lib/cn'

type PeriodoResumo = 'hoje' | 'semana' | 'mes'

type Aba48h = 'furos' | 'anunciados' | 'trocas' | 'candidaturas'

const SELECT_CLASS =
  'min-w-[11rem] rounded-md border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm text-slate-700 shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'

const contagem48h = {
  furos: 0,
  anunciados: 3,
  trocas: 0,
  candidaturas: 0,
} as const

const plantoesAnunciadosMock = [
  {
    id: '1',
    titulo: 'UTI Cardio — 12h diurno',
    local: 'HOSPITAL AMAZÔNIA',
    inicio: 'Em 6h',
  },
  {
    id: '2',
    titulo: 'PS Central — 6h noturno',
    local: 'PRONTO SOCORRO CENTRAL',
    inicio: 'Em 14h',
  },
  {
    id: '3',
    titulo: 'Ambulatório — 6h',
    local: 'HOSPITAL REGIONAL NORTE',
    inicio: 'Amanhã · 07:00',
  },
] as const

const tiposPlantaoMesAnterior = [
  { tipo: 'Normal', total: 412, furos: 18, cor: 'bg-slate-300' },
  { tipo: 'Fim de semana', total: 156, furos: 9, cor: 'bg-warning-500' },
  { tipo: 'Noturno', total: 98, furos: 4, cor: 'bg-primary-600' },
] as const

const donutFracoes = [
  { key: 'normal', frac: 0.62, cor: '#cbd5e1' },
  { key: 'fds', frac: 0.24, cor: '#f97316' },
  { key: 'not', frac: 0.14, cor: '#2563eb' },
] as const

const profissionaisSemanaMock = [
  { n: 1, nome: 'Dra. Ana Paula Ferreira', realizados: 5, horas: '60h', coberturas: 4 },
  { n: 2, nome: 'Dr. Carlos Mendes Silva', realizados: 4, horas: '48h', coberturas: 4 },
  { n: 3, nome: 'Enf. Mariana Costa', realizados: 6, horas: '72h', coberturas: 5 },
  { n: 4, nome: 'Dr. Roberto Lima', realizados: 3, horas: '36h', coberturas: 3 },
  { n: 5, nome: 'Dra. Juliana Rocha', realizados: 5, horas: '60h', coberturas: 4 },
  { n: 6, nome: 'Dr. Paulo Henrique Alves', realizados: 4, horas: '48h', coberturas: 3 },
  { n: 7, nome: 'Enf. Fernanda Duarte', realizados: 5, horas: '60h', coberturas: 5 },
  { n: 8, nome: 'Dr. Lucas Vieira', realizados: 3, horas: '36h', coberturas: 2 },
  { n: 9, nome: 'Dra. Camila Nogueira', realizados: 4, horas: '48h', coberturas: 4 },
  { n: 10, nome: 'Dr. André Freitas', realizados: 5, horas: '60h', coberturas: 4 },
] as const

const mesesGrafico = ['Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago'] as const
const serieTotal = [320, 340, 380, 400, 420, 450, 480]
const serieCoberturas = [280, 300, 340, 360, 380, 400, 420]
const serieFuros = [40, 35, 30, 45, 50, 55, 45]

const W = 640
const H = 220
const PAD = { l: 44, r: 16, t: 16, b: 36 }
const Y_MAX = 600

function escalaY(v: number) {
  const innerH = H - PAD.t - PAD.b
  return PAD.t + innerH * (1 - v / Y_MAX)
}

function escalaX(i: number) {
  const innerW = W - PAD.l - PAD.r
  const n = mesesGrafico.length - 1
  return PAD.l + (innerW * i) / n
}

function pathLinha(valores: number[]) {
  return valores
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${escalaX(i)} ${escalaY(v)}`)
    .join(' ')
}

function pathArea(valores: number[]) {
  const baseY = escalaY(0)
  const primeiro = `M ${escalaX(0)} ${baseY} L ${escalaX(0)} ${escalaY(valores[0])}`
  const meio = valores
    .map((v, i) => `L ${escalaX(i)} ${escalaY(v)}`)
    .join(' ')
  const ultimo = `L ${escalaX(valores.length - 1)} ${baseY} Z`
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

function DonutTiposPlantao() {
  let acum = 0
  const stops = donutFracoes
    .map((s) => {
      const ini = acum * 360
      acum += s.frac
      const fim = acum * 360
      return `${s.cor} ${ini}deg ${fim}deg`
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
              666
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
            {tiposPlantaoMesAnterior.map((row) => (
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

function GraficoPlantoesPeriodo() {
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
          y1={escalaY(0)}
          x2={W - PAD.r}
          y2={escalaY(0)}
          className="stroke-slate-200"
          strokeWidth={1}
        />
        {[150, 300, 450].map((tick) => (
          <g key={tick}>
            <line
              x1={PAD.l}
              y1={escalaY(tick)}
              x2={W - PAD.r}
              y2={escalaY(tick)}
              className="stroke-slate-100"
              strokeWidth={1}
              strokeDasharray="4 4"
            />
            <text
              x={PAD.l - 8}
              y={escalaY(tick)}
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
          y={escalaY(0)}
          textAnchor="end"
          dominantBaseline="middle"
          className="fill-slate-400 text-[10px] tabular-nums"
        >
          0
        </text>

        <path
          d={pathArea(serieTotal)}
          className="fill-primary-200/40 stroke-none"
        />
        <path
          d={pathArea(serieCoberturas)}
          className="fill-success-200/55 stroke-none"
        />

        <path
          d={pathLinha(serieTotal)}
          fill="none"
          className="stroke-primary-600"
          strokeWidth={2}
          strokeLinejoin="round"
        />
        <path
          d={pathLinha(serieCoberturas)}
          fill="none"
          className="stroke-success-600"
          strokeWidth={2}
          strokeLinejoin="round"
        />

        <path
          d={pathLinha(serieFuros)}
          fill="none"
          className="stroke-danger-500"
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {mesesGrafico.map((m, i) => (
          <text
            key={m}
            x={escalaX(i)}
            y={H - 10}
            textAnchor="middle"
            className="fill-slate-500 text-[10px] font-medium"
          >
            {m}
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

export function ResumoPage() {
  const idPeriodo = useId()
  const idSetor = useId()
  const [periodo, setPeriodo] = useState<PeriodoResumo>('mes')
  const [setor, setSetor] = useState('')
  const [aba48h, setAba48h] = useState<Aba48h>('anunciados')

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

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 bg-slate-50">
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
                <option value="uti">UTI</option>
                <option value="ps">Pronto-socorro</option>
                <option value="amb">Ambulatório</option>
                <option value="cc">Centro cirúrgico</option>
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
            {aba48h === 'anunciados' ? (
              <ul className="w-full max-w-lg space-y-2 px-1 text-left text-sm">
                {plantoesAnunciadosMock.map((p) => (
                  <li
                    key={p.id}
                    className="flex flex-col gap-0.5 rounded-lg border border-slate-100 bg-white px-3 py-2.5 shadow-sm transition-colors hover:border-primary-200 hover:bg-primary-50/30 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{p.titulo}</p>
                      <p className="text-xs text-slate-500">{p.local}</p>
                    </div>
                    <span className="shrink-0 text-xs font-medium tabular-nums text-primary-700 sm:text-sm">
                      {p.inicio}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm font-medium text-slate-500">
                Sem resultados
              </p>
            )}
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
          <DonutTiposPlantao />
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
                {profissionaisSemanaMock.map((row) => (
                  <tr
                    key={row.n}
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
                ))}
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
            Visão consolidada (exemplo) — recorte{' '}
            {periodo === 'hoje'
              ? 'diário'
              : periodo === 'semana'
                ? 'semanal'
                : 'mensal'}
            . Eixo até {Y_MAX} plantões.
          </p>
          <GraficoPlantoesPeriodo />
        </CardShell>
      </div>
    </div>
  )
}
