import {
  ArrowLeftRight,
  ArrowUpRight,
  Calendar,
  CalendarDays,
  Copy,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { useTenantUserId } from '../hooks/useTenantUserId'
import { cn } from '../lib/cn'
import {
  buscarIndicadoresHubEscalas,
  type IndicadoresHubEscalas,
} from '../lib/escalas/escalaHubDb'

type HubCard = {
  id: string
  titulo: string
  descricao: string
  to: string
  icon: typeof Calendar
  gradient: string
  indicadorLabel: string
  indicadorValor: (k: IndicadoresHubEscalas) => number
  destaque?: boolean
}

const CARDS: HubCard[] = [
  {
    id: 'mensal',
    titulo: 'Visão Mensal',
    descricao: 'Grade consolidada do mês com status de confirmação e cobertura por setor.',
    to: '/escalas/mensal',
    icon: Calendar,
    gradient: 'from-blue-600/90 via-blue-700/95 to-indigo-900',
    indicadorLabel: 'Plantões no mês',
    indicadorValor: (k) => k.plantoesMes,
    destaque: true,
  },
  {
    id: 'semanal',
    titulo: 'Visão Semanal',
    descricao: 'Operação tática da semana com edição rápida e validações de escala.',
    to: '/escalas/semanal',
    icon: CalendarDays,
    gradient: 'from-violet-600/90 via-purple-700/95 to-fuchsia-900',
    indicadorLabel: 'Plantões na semana',
    indicadorValor: (k) => k.plantoesSemana,
  },
  {
    id: 'mural',
    titulo: 'Mural de Trocas',
    descricao: 'Anúncios de substituição e candidaturas aguardando aprovação da coordenação.',
    to: '/escalas/mural-trocas',
    icon: ArrowLeftRight,
    gradient: 'from-amber-500/90 via-orange-600/95 to-rose-800',
    indicadorLabel: 'Aguardando aprovação',
    indicadorValor: (k) => k.candidaturasPendentes,
  },
  {
    id: 'modelos',
    titulo: 'Modelos de Escala',
    descricao: 'Templates reutilizáveis para acelerar a produção de escalas semanais e mensais.',
    to: '/escalas/modelos',
    icon: Copy,
    gradient: 'from-teal-600/90 via-emerald-700/95 to-cyan-900',
    indicadorLabel: 'Modelos cadastrados',
    indicadorValor: (k) => k.totalModelos,
  },
]

const INDICADORES_VAZIOS: IndicadoresHubEscalas = {
  plantoesMes: 0,
  plantoesSemana: 0,
  candidaturasPendentes: 0,
  totalModelos: 0,
}

export function EscalasPage() {
  const { tenantUserId, isLoading } = useTenantUserId()
  const [indicadores, setIndicadores] = useState<IndicadoresHubEscalas>(INDICADORES_VAZIOS)
  const [carregandoKpi, setCarregandoKpi] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const recarregar = useCallback(async () => {
    if (!tenantUserId) return
    setCarregandoKpi(true)
    setErro(null)
    try {
      const dados = await buscarIndicadoresHubEscalas(tenantUserId)
      setIndicadores(dados)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível carregar indicadores.')
    } finally {
      setCarregandoKpi(false)
    }
  }, [tenantUserId])

  useEffect(() => {
    if (isLoading) return
    void recarregar()
    const intervalo = window.setInterval(() => void recarregar(), 60_000)
    return () => window.clearInterval(intervalo)
  }, [isLoading, recarregar])

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 pb-10">
      <header className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 px-6 py-8 text-white shadow-xl md:px-10 md:py-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-indigo-400/10 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" aria-hidden />
            Hub de Escalas
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight md:text-3xl">
            Central de Operação de Escalas
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-300 md:text-base">
            Acesso rápido às visões operacionais, trocas e modelos — com indicadores atualizados
            em tempo real.
          </p>
        </div>
      </header>

      {erro ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {erro}
        </div>
      ) : null}

      <section
        aria-label="Atalhos de escalas"
        className="grid auto-rows-fr grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-12"
      >
        {CARDS.map((card, index) => {
          const Icon = card.icon
          const valor = card.indicadorValor(indicadores)
          const alerta = card.id === 'mural' && valor > 0

          return (
            <Link
              key={card.id}
              to={card.to}
              className={cn(
                'group relative flex min-h-[180px] flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600',
                card.destaque ? 'md:col-span-2 lg:col-span-7 lg:row-span-2 lg:min-h-[280px] lg:p-7' : 'lg:col-span-5',
                index === 1 && 'lg:col-start-8',
                index === 2 && 'lg:col-start-1 lg:col-span-5',
                index === 3 && 'lg:col-start-6 lg:col-span-7',
              )}
            >
              <div
                className={cn(
                  'pointer-events-none absolute inset-0 bg-gradient-to-br opacity-[0.07] transition group-hover:opacity-[0.11]',
                  card.gradient,
                )}
              />
              <div className="relative flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={cn(
                      'inline-flex rounded-xl bg-gradient-to-br p-2.5 text-white shadow-md',
                      card.gradient,
                    )}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <ArrowUpRight
                    className="h-4 w-4 text-slate-400 transition group-hover:text-slate-700"
                    aria-hidden
                  />
                </div>

                <h2
                  className={cn(
                    'mt-4 font-semibold text-slate-900',
                    card.destaque ? 'text-xl lg:text-2xl' : 'text-lg',
                  )}
                >
                  {card.titulo}
                </h2>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-600">
                  {card.descricao}
                </p>

                <div className="mt-5 flex items-end justify-between gap-3 border-t border-slate-100 pt-4">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                      {card.indicadorLabel}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      {carregandoKpi ? (
                        <Loader2 className="h-5 w-5 animate-spin text-slate-400" aria-hidden />
                      ) : (
                        <span
                          className={cn(
                            'text-2xl font-semibold tabular-nums',
                            alerta ? 'text-amber-600' : 'text-slate-900',
                          )}
                        >
                          {valor}
                        </span>
                      )}
                      {alerta ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                          Ação necessária
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <span className="text-xs font-medium text-blue-700 group-hover:underline">
                    Abrir →
                  </span>
                </div>
              </div>
            </Link>
          )
        })}
      </section>
    </div>
  )
}
