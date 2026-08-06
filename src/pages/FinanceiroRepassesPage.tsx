import {
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  Wallet,
  AlertCircle,
} from 'lucide-react'
import { endOfMonth, format, startOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { useSupabaseUser } from '../hooks/useSupabaseUser'
import { cn } from '../lib/cn'
import {
  atualizarStatusExtratoParaPago,
  buscarAgregadosFinanceirosPorProfissional,
  buscarExtratosPeriodoPorCompetencia,
  buscarProfissionaisLista,
  type AgregadoProfissionalFinanceiro,
  type ExtratoPeriodoResumo,
} from '../lib/financeiro/financeiroData'

function fmtBRL(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function capitalizar(s: string): string {
  return s.slice(0, 1).toUpperCase() + s.slice(1)
}

type BadgeFinanceiro = 'pendente' | 'processado' | 'pago' | 'sem_extrato'

const BADGE: Record<
  BadgeFinanceiro,
  { rotulo: string; className: string; icon: typeof Clock }
> = {
  pendente: {
    rotulo: 'Pendente',
    className: 'bg-amber-100 text-amber-950 ring-amber-400/50',
    icon: Clock,
  },
  processado: {
    rotulo: 'Processado',
    className: 'bg-sky-100 text-sky-950 ring-sky-400/50',
    icon: AlertCircle,
  },
  pago: {
    rotulo: 'Pago',
    className: 'bg-emerald-100 text-emerald-950 ring-emerald-500/40',
    icon: CheckCircle2,
  },
  sem_extrato: {
    rotulo: 'Sem registo de extrato',
    className: 'bg-slate-100 text-slate-800 ring-slate-300/60',
    icon: Clock,
  },
}

function normalizarStatusExtrato(s: string | undefined): BadgeFinanceiro {
  if (s === 'processado' || s === 'pago' || s === 'pendente') return s
  return 'pendente'
}

function extratoBloqueado(p: ExtratoPeriodoResumo): boolean {
  return Boolean(p.extrato_fechado === true || p.fechado_em)
}

type LinhaTabela = {
  profissionalId: string
  nome: string
  totalBruto: number
  totalLiquido: number
  totalDescontosGlosas: number
  periodo: ExtratoPeriodoResumo | null
}

export function FinanceiroRepassesPage() {
  const { user, isLoading: authLoading } = useSupabaseUser()
  const agora = useMemo(() => new Date(), [])
  const [competencia, setCompetencia] = useState(
    () =>
      `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`,
  )
  const [linhas, setLinhas] = useState<LinhaTabela[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [salvandoId, setSalvandoId] = useState<string | null>(null)

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
      setLinhas([])
      setCarregando(false)
      return
    }
    setCarregando(true)
    setErro(null)
    try {
      const [todosProfissionais, agregados, periodos] = await Promise.all([
        buscarProfissionaisLista(user.id),
        buscarAgregadosFinanceirosPorProfissional(
          user.id,
          intervalo.inicio,
          intervalo.fim,
        ),
        buscarExtratosPeriodoPorCompetencia(user.id, competencia),
      ])

      const aggMap = new Map<string, AgregadoProfissionalFinanceiro>(
        agregados.map((a) => [a.profissionalId, a]),
      )
      const periodoPorProf = new Map<string, ExtratoPeriodoResumo>()
      for (const row of periodos) {
        periodoPorProf.set(row.profissional_id, row)
      }

      const montado: LinhaTabela[] = todosProfissionais.map((p) => {
        const agg = aggMap.get(p.id)
        return {
          profissionalId: p.id,
          nome: p.nome,
          totalBruto: agg?.totalBruto ?? 0,
          totalLiquido: agg?.totalLiquido ?? 0,
          totalDescontosGlosas: agg?.totalDescontosGlosas ?? 0,
          periodo: periodoPorProf.get(p.id) ?? null,
        }
      })

      setLinhas(montado)
    } catch (e) {
      setErro(
        e instanceof Error ? e.message : 'Erro ao carregar repasses.',
      )
      setLinhas([])
    } finally {
      setCarregando(false)
    }
  }, [user, competencia, intervalo.inicio, intervalo.fim])

  useEffect(() => {
    if (authLoading) return
    void carregar()
  }, [authLoading, carregar])

  async function marcarComoPago(periodoId: string) {
    if (!user) return
    if (
      !window.confirm(
        'Confirmar repasse como pago? O status do extrato passará a «Pago».',
      )
    ) {
      return
    }
    setSalvandoId(periodoId)
    setErro(null)
    try {
      await atualizarStatusExtratoParaPago(user.id, periodoId)
      await carregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao atualizar.')
    } finally {
      setSalvandoId(null)
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-12">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Financeiro
          </p>
          <div className="mt-1 flex items-center gap-2">
            <Wallet className="h-7 w-7 text-emerald-600" aria-hidden />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Repasses
            </h1>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Líquido a repassar por profissional (somando plantões{' '}
            <strong>realizados</strong> na competência) e estado do extrato em{' '}
            <code className="rounded bg-slate-100 px-1 text-xs">
              financeiro_extrato_periodo
            </code>
            . Para desbloquear «Marcar como pago», o extrato deve estar fechado e com
            status «Processado» — o mesmo fluxo da página de Extratos.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <label className="text-xs font-medium text-slate-600">Competência</label>
          <input
            type="month"
            value={competencia}
            onChange={(e) => setCompetencia(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
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

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void carregar()}
          disabled={carregando}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            className={cn('h-4 w-4', carregando && 'animate-spin')}
            aria-hidden
          />
          Atualizar
        </button>
        <p className="text-xs text-slate-500">{intervalo.rotulo}</p>
      </div>

      <div className="overflow-hidden ug-card shadow-sm">
        {carregando ? (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-600">
            <Loader2 className="h-6 w-6 animate-spin text-primary-600" aria-hidden />
            A carregar repasses…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[56rem] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Profissional
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Bruto
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Glosas
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Líquido
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Estado do extrato
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Repasse
                  </th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((row) => {
                  const per = row.periodo
                  const statusKey: BadgeFinanceiro = per
                    ? normalizarStatusExtrato(per.status_financeiro)
                    : 'sem_extrato'
                  const b = BADGE[statusKey]
                  const Icone = b.icon
                  const podePagar =
                    per &&
                    extratoBloqueado(per) &&
                    normalizarStatusExtrato(per.status_financeiro) === 'processado'

                  return (
                    <tr key={row.profissionalId} className="border-b border-slate-100">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {row.nome}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-800">
                        {fmtBRL(row.totalBruto)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-amber-900">
                        {fmtBRL(row.totalDescontosGlosas)}
                      </td>
                      <td className="px-4 py-3 text-right text-base font-semibold tabular-nums text-emerald-900">
                        {fmtBRL(row.totalLiquido)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
                            b.className,
                          )}
                        >
                          <Icone className="h-3.5 w-3.5" aria-hidden />
                          {b.rotulo}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {podePagar && per ? (
                          <button
                            type="button"
                            disabled={salvandoId === per.id}
                            onClick={() => void marcarComoPago(per.id)}
                            className="inline-flex items-center gap-2 rounded-lg border border-emerald-600 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 disabled:opacity-50"
                          >
                            {salvandoId === per.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                            )}
                            Marcar pago
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">
                            {per
                              ? !extratoBloqueado(per)
                                ? 'Feche o extrato em Extratos primeiro'
                                : normalizarStatusExtrato(per.status_financeiro) === 'pago'
                                  ? '—'
                                  : 'Processar antes de pagar'
                              : 'Sem linha de extrato neste mês'}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500">
        Profissionais sem plantões realizados na competência mostram líquido zero. O
        registo em <strong>extrato</strong> só aparece após fechamento na página de
        Extratos (ou atualização manual equivalente na base).
      </p>
    </div>
  )
}
