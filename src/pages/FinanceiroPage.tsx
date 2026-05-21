import {
  ArrowRight,
  Calendar,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  Wallet,
} from 'lucide-react'
import { endOfMonth, format, startOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { useSupabaseUser } from '../hooks/useSupabaseUser'
import { cn } from '../lib/cn'
import {
  carregarResumoCompetencia,
  type ExtratoPeriodoResumo,
} from '../lib/financeiro/financeiroData'
import type { TotaisExtratoFinanceiro } from '../lib/financeiro/extratoCalculos'

function fmtBRL(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function capitalizar(s: string): string {
  return s.slice(0, 1).toUpperCase() + s.slice(1)
}

function contarPorStatus(periodos: ExtratoPeriodoResumo[]) {
  let pendente = 0
  let processado = 0
  let pago = 0
  for (const p of periodos) {
    if (p.status_financeiro === 'pago') pago++
    else if (p.status_financeiro === 'processado') processado++
    else pendente++
  }
  return { pendente, processado, pago }
}

export function FinanceiroPage() {
  const { user, isLoading: authLoading } = useSupabaseUser()
  const agora = useMemo(() => new Date(), [])
  const [competencia, setCompetencia] = useState(
    () =>
      `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`,
  )
  const [totais, setTotais] = useState<TotaisExtratoFinanceiro | null>(null)
  const [numLinhas, setNumLinhas] = useState(0)
  const [periodos, setPeriodos] = useState<ExtratoPeriodoResumo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const intervalo = useMemo(() => {
    const [y, m] = competencia.split('-').map(Number)
    const base = new Date(y, m! - 1, 1)
    return {
      inicio: format(startOfMonth(base), 'yyyy-MM-dd'),
      fim: format(endOfMonth(base), 'yyyy-MM-dd'),
      rotulo: capitalizar(
        format(startOfMonth(base), 'MMMM yyyy', { locale: ptBR }),
      ),
    }
  }, [competencia])

  const carregar = useCallback(async () => {
    if (!user) {
      setTotais(null)
      setNumLinhas(0)
      setPeriodos([])
      setCarregando(false)
      return
    }
    setCarregando(true)
    setErro(null)
    try {
      const r = await carregarResumoCompetencia(
        user.id,
        competencia,
        intervalo.inicio,
        intervalo.fim,
      )
      setTotais(r.totais)
      setNumLinhas(r.linhas.length)
      setPeriodos(r.periodos)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar resumo.')
      setTotais(null)
      setNumLinhas(0)
      setPeriodos([])
    } finally {
      setCarregando(false)
    }
  }, [user, competencia, intervalo.inicio, intervalo.fim])

  useEffect(() => {
    if (authLoading) return
    void carregar()
  }, [authLoading, carregar])

  const statusExtratos = useMemo(() => contarPorStatus(periodos), [periodos])

  const linkCardClass =
    'group flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-primary-300 hover:bg-primary-50/40'

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 pb-12">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary-700">
          Financeiro
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Visão geral
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Totais da competência com base em plantões <strong>realizados</strong> e
              registos de extrato no Supabase. Use os atalhos para detalhar linhas,
              glosas e repasses.
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">
              Competência
            </label>
            <input
              type="month"
              value={competencia}
              onChange={(e) => setCompetencia(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </header>

      {erro ? (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
        >
          {erro}
        </div>
      ) : null}

      <section aria-label="Totais do mês">
        {carregando ? (
          <div className="flex items-center gap-2 text-slate-600">
            <Loader2 className="h-5 w-5 animate-spin text-primary-600" aria-hidden />
            A carregar dados…
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Plantões no extrato
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
                {numLinhas}
              </p>
              <p className="mt-1 text-xs text-slate-500">{intervalo.rotulo}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Total bruto
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
                {fmtBRL(totais?.totalBruto ?? 0)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Descontos / glosas
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-amber-900">
                {fmtBRL(totais?.totalDescontosGlosas ?? 0)}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/70 p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-900">
                Líquido (conta)
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-950">
                {fmtBRL(totais?.totalLiquido ?? 0)}
              </p>
            </div>
          </div>
        )}
      </section>

      <section aria-label="Extratos fechados por profissional">
        <h2 className="mb-3 text-sm font-semibold text-slate-800">
          Extratos por profissional nesta competência
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3">
            <p className="text-xs font-medium text-amber-900">Pendente</p>
            <p className="text-xl font-bold tabular-nums text-amber-950">
              {statusExtratos.pendente}
            </p>
          </div>
          <div className="rounded-lg border border-sky-200 bg-sky-50/80 px-4 py-3">
            <p className="text-xs font-medium text-sky-900">Processado</p>
            <p className="text-xl font-bold tabular-nums text-sky-950">
              {statusExtratos.processado}
            </p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 px-4 py-3">
            <p className="text-xs font-medium text-emerald-900">Pago</p>
            <p className="text-xl font-bold tabular-nums text-emerald-950">
              {statusExtratos.pago}
            </p>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Valores atualizados quando fecha o extrato por profissional em Extratos. Os totais
          acima somam todos os plantões realizados no mês (visão consolidada).
        </p>
      </section>

      <section aria-label="Atalhos">
        <h2 className="mb-3 text-sm font-semibold text-slate-800">
          Onde continuar
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Link to="/financeiro/extratos" className={cn(linkCardClass)}>
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary-100 text-primary-700">
              <FileSpreadsheet className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-900">Extrato financeiro</p>
              <p className="mt-0.5 text-sm text-slate-600">
                Linha a linha: valores, glosas, fechamento e recibo em PDF.
              </p>
            </div>
            <ArrowRight
              className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-primary-600"
              aria-hidden
            />
          </Link>

          <Link to="/financeiro/repasses" className={cn(linkCardClass)}>
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-emerald-100 text-emerald-800">
              <Wallet className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-900">Repasses</p>
              <p className="mt-0.5 text-sm text-slate-600">
                Líquido por profissional e marcação de pagamento (status «pago»).
              </p>
            </div>
            <ArrowRight
              className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-primary-600"
              aria-hidden
            />
          </Link>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-6">
        <button
          type="button"
          onClick={() => void carregar()}
          disabled={carregando || authLoading}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            className={cn('h-4 w-4', carregando && 'animate-spin')}
            aria-hidden
          />
          Atualizar
        </button>
        <span className="inline-flex items-center gap-2 text-xs text-slate-500">
          <Calendar className="h-4 w-4" aria-hidden />
          Dados vêm de <code className="rounded bg-slate-100 px-1">plantoes</code> e{' '}
          <code className="rounded bg-slate-100 px-1">financeiro_extrato_periodo</code>.
        </span>
      </div>
    </div>
  )
}
