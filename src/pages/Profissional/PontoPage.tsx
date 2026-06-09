import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Building2,
  Clock3,
  Loader2,
  MapPin,
  MapPinned,
  Timer,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

import { useContaMembro } from '../../hooks/useContaMembro'
import { cn } from '../../lib/cn'
import { obterPosicaoAtual } from '../../lib/ponto/geolocalizacao'
import {
  buscarPlantoesHojeProfissional,
  buscarRegistroAbertoPlantao,
  formatarHoraPlantao,
  listarUltimosRegistrosPonto,
  registrarCheckIn,
  registrarCheckOut,
} from '../../lib/ponto/registroPontoDb'
import {
  RAIO_CHECKIN_METROS,
  ROTULOS_STATUS_PONTO,
  type PlantaoPontoHoje,
  type RegistroPontoRow,
} from '../../lib/ponto/registroPontoTypes'

function formatarCronometro(segundos: number): string {
  const h = Math.floor(segundos / 3600)
  const m = Math.floor((segundos % 3600) / 60)
  const s = segundos % 60
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':')
}

function formatarDataHora(iso: string | null): string {
  if (!iso) return '—'
  return format(new Date(iso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

export function PontoPage() {
  const { isLoading, isMembroProfissional, isTitular, profissionalId, tenantUserId } =
    useContaMembro()

  const [carregando, setCarregando] = useState(true)
  const [processando, setProcessando] = useState(false)
  const [plantoesHoje, setPlantoesHoje] = useState<PlantaoPontoHoje[]>([])
  const [registroAberto, setRegistroAberto] = useState<RegistroPontoRow | null>(null)
  const [historico, setHistorico] = useState<RegistroPontoRow[]>([])
  const [segundosDecorridos, setSegundosDecorridos] = useState(0)
  const [erro, setErro] = useState<string | null>(null)

  const plantaoAtivo = useMemo(() => {
    if (registroAberto) {
      return plantoesHoje.find((p) => p.id === registroAberto.plantao_id) ?? plantoesHoje[0] ?? null
    }
    return (
      plantoesHoje.find((p) => p.status === 'confirmado' || p.status === 'pendente') ??
      plantoesHoje[0] ??
      null
    )
  }, [plantoesHoje, registroAberto])

  const turnoAtivo = Boolean(registroAberto)

  const carregar = useCallback(async () => {
    if (!tenantUserId || !profissionalId) {
      setPlantoesHoje([])
      setRegistroAberto(null)
      setHistorico([])
      setCarregando(false)
      return
    }

    setCarregando(true)
    setErro(null)
    try {
      const [plantoes, registros] = await Promise.all([
        buscarPlantoesHojeProfissional(tenantUserId, profissionalId),
        listarUltimosRegistrosPonto(profissionalId),
      ])
      setPlantoesHoje(plantoes)
      setHistorico(registros)

      let aberto: RegistroPontoRow | null = null
      for (const plantao of plantoes) {
        const reg = await buscarRegistroAbertoPlantao(plantao.id)
        if (reg) {
          aberto = reg
          break
        }
      }
      setRegistroAberto(aberto)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar dados de ponto.')
      setPlantoesHoje([])
      setRegistroAberto(null)
      setHistorico([])
    } finally {
      setCarregando(false)
    }
  }, [profissionalId, tenantUserId])

  useEffect(() => {
    if (isLoading) return
    void carregar()
  }, [isLoading, carregar])

  useEffect(() => {
    if (!registroAberto?.entrada_em) {
      setSegundosDecorridos(0)
      return
    }

    const entrada = new Date(registroAberto.entrada_em).getTime()
    const atualizar = () => {
      setSegundosDecorridos(Math.max(0, Math.floor((Date.now() - entrada) / 1000)))
    }
    atualizar()
    const id = window.setInterval(atualizar, 1000)
    return () => window.clearInterval(id)
  }, [registroAberto?.entrada_em])

  async function aoCheckIn() {
    if (!plantaoAtivo || !tenantUserId || !profissionalId) return
    setProcessando(true)
    try {
      const posicao = await obterPosicaoAtual()
      const registro = await registrarCheckIn({
        tenantUserId,
        profissionalId,
        plantao: plantaoAtivo,
        posicao,
      })
      setRegistroAberto(registro)
      toast.success('Plantão iniciado com sucesso!')
      await carregar()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha no check-in.')
    } finally {
      setProcessando(false)
    }
  }

  async function aoCheckOut() {
    if (!plantaoAtivo || !registroAberto) return
    setProcessando(true)
    try {
      const posicao = await obterPosicaoAtual()
      await registrarCheckOut({
        registro: registroAberto,
        plantao: plantaoAtivo,
        posicao,
      })
      setRegistroAberto(null)
      toast.success('Plantão finalizado com sucesso!')
      await carregar()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha no check-out.')
    } finally {
      setProcessando(false)
    }
  }

  if (isLoading || carregando) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-2 text-slate-600">
        <Loader2 className="h-6 w-6 animate-spin text-primary-600" aria-hidden />
        A carregar ponto eletrónico…
      </div>
    )
  }

  if (!isMembroProfissional || !profissionalId) {
    return (
      <section className="mx-auto w-full max-w-lg space-y-4 px-1">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-slate-900">Ponto eletrónico</h1>
          <p className="mt-2 text-sm text-slate-600">
            {isTitular
              ? 'Esta área é exclusiva para profissionais com login próprio. Aceda com a conta de membro para registar ponto.'
              : 'Nenhum perfil profissional associado a esta conta.'}
          </p>
          <Link
            to="/meus-dados"
            className="mt-4 inline-flex text-sm font-medium text-primary-700 hover:underline"
          >
            Voltar a Meus dados
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto w-full max-w-lg space-y-6 px-1 pb-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">Ponto eletrónico</h1>
        <p className="mt-1 text-sm text-slate-600">
          Registe entrada e saída com validação por GPS (raio de {RAIO_CHECKIN_METROS} m).
        </p>
      </div>

      {erro ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {erro}
        </div>
      ) : null}

      {plantaoAtivo ? (
        <article className="overflow-hidden rounded-2xl border border-primary-200 bg-gradient-to-br from-primary-50 to-white shadow-sm ring-1 ring-primary-100">
          <div className="border-b border-primary-100 bg-primary-600 px-5 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-100">
              Plantão de hoje
            </p>
          </div>
          <div className="space-y-4 p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
                <Building2 className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-lg font-semibold text-slate-900">{plantaoAtivo.hospital}</p>
                <p className="text-sm text-slate-600">{plantaoAtivo.setor}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-white/80 px-4 py-3 text-sm text-slate-700 ring-1 ring-slate-200/80">
              <Clock3 className="h-4 w-4 shrink-0 text-primary-600" aria-hidden />
              <span>
                {formatarHoraPlantao(plantaoAtivo.hora_inicio)} –{' '}
                {formatarHoraPlantao(plantaoAtivo.hora_fim)}
              </span>
            </div>

            {turnoAtivo ? (
              <div className="space-y-4">
                <div className="rounded-2xl bg-slate-900 px-5 py-6 text-center text-white">
                  <p className="text-xs font-medium uppercase tracking-widest text-slate-400">
                    Tempo em plantão
                  </p>
                  <p className="mt-2 font-mono text-4xl font-bold tracking-tight tabular-nums sm:text-5xl">
                    {formatarCronometro(segundosDecorridos)}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    Entrada: {formatarDataHora(registroAberto?.entrada_em ?? null)}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={processando}
                  onClick={() => void aoCheckOut()}
                  className={cn(
                    'flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-semibold text-white shadow-lg transition',
                    'bg-red-600 hover:bg-red-700 active:scale-[0.99] disabled:opacity-60',
                  )}
                >
                  {processando ? (
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                  ) : (
                    <Timer className="h-5 w-5" aria-hidden />
                  )}
                  Finalizar Plantão (Check-out)
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={processando || plantaoAtivo.status === 'realizado'}
                onClick={() => void aoCheckIn()}
                className={cn(
                  'flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-5 text-base font-semibold text-white shadow-lg transition',
                  'bg-primary-600 hover:bg-primary-700 active:scale-[0.99] disabled:opacity-60',
                )}
              >
                {processando ? (
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                ) : (
                  <MapPinned className="h-5 w-5" aria-hidden />
                )}
                Iniciar Plantão (Check-in)
              </button>
            )}
          </div>
        </article>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
          <MapPin className="mx-auto h-10 w-10 text-slate-300" aria-hidden />
          <p className="mt-3 text-sm font-medium text-slate-800">
            Nenhum plantão agendado para hoje
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Quando tiver um turno confirmado, o registo de ponto aparecerá aqui.
          </p>
          <Link
            to="/minha-agenda"
            className="mt-4 inline-flex text-sm font-medium text-primary-700 hover:underline"
          >
            Ver minha agenda
          </Link>
        </div>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Últimos registos</h2>
        {historico.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
            Ainda não há pontos registados.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {historico.map((reg) => (
              <li key={reg.id} className="px-4 py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900">
                      {format(new Date(reg.entrada_em), "dd 'de' MMMM", { locale: ptBR })}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Entrada {format(new Date(reg.entrada_em), 'HH:mm')}
                      {reg.saida_em
                        ? ` · Saída ${format(new Date(reg.saida_em), 'HH:mm')}`
                        : ' · Em andamento'}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                    {ROTULOS_STATUS_PONTO[reg.status]}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
