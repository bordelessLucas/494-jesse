import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Loader2, MapPin, MapPinned, Timer } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

import { PontoAlertaDistanciaModal } from '../../components/Ponto/PontoAlertaDistanciaModal'
import { PontoPlantaoAtualCard } from '../../components/Ponto/PontoPlantaoAtualCard'
import { useContaMembro } from '../../hooks/useContaMembro'
import { cn } from '../../lib/cn'
import { obterPosicaoAtual } from '../../lib/ponto/geolocalizacao'
import {
  buscarPlantoesHojeProfissional,
  buscarRegistroAbertoPlantao,
  listarUltimosRegistrosPonto,
  registrarCheckIn,
  registrarCheckOut,
} from '../../lib/ponto/registroPontoDb'
import {
  RAIO_CHECKIN_METROS,
  ROTULOS_STATUS_PONTO,
  isErroDistanciaCheckin,
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

type EtapaProcessamento = 'idle' | 'gps' | 'gravando'

export function PontoPage() {
  const { isLoading, isMembroProfissional, isTitular, profissionalId, tenantUserId } =
    useContaMembro()

  const [carregando, setCarregando] = useState(true)
  const [etapa, setEtapa] = useState<EtapaProcessamento>('idle')
  const [plantoesHoje, setPlantoesHoje] = useState<PlantaoPontoHoje[]>([])
  const [plantaoSelecionadoId, setPlantaoSelecionadoId] = useState<string | null>(null)
  const [registroAberto, setRegistroAberto] = useState<RegistroPontoRow | null>(null)
  const [historico, setHistorico] = useState<RegistroPontoRow[]>([])
  const [segundosDecorridos, setSegundosDecorridos] = useState(0)
  const [erro, setErro] = useState<string | null>(null)
  const [alertaDistanciaAberto, setAlertaDistanciaAberto] = useState(false)

  const processando = etapa !== 'idle'

  const plantaoAtivo = useMemo(() => {
    if (registroAberto) {
      return (
        plantoesHoje.find((p) => p.id === registroAberto.plantao_id) ??
        plantoesHoje.find((p) => p.id === plantaoSelecionadoId) ??
        plantoesHoje[0] ??
        null
      )
    }
    if (plantaoSelecionadoId) {
      return plantoesHoje.find((p) => p.id === plantaoSelecionadoId) ?? null
    }
    return (
      plantoesHoje.find((p) => p.status === 'confirmado' || p.status === 'pendente') ??
      plantoesHoje[0] ??
      null
    )
  }, [plantoesHoje, registroAberto, plantaoSelecionadoId])

  const turnoAtivo = Boolean(registroAberto)
  const plantoesSelecionaveis = plantoesHoje.filter((p) => p.status !== 'realizado')

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
      if (aberto) {
        setPlantaoSelecionadoId(aberto.plantao_id)
      }
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

  function tratarErroPonto(e: unknown) {
    const mensagem = e instanceof Error ? e.message : 'Operação falhou. Tente novamente.'
    if (isErroDistanciaCheckin(mensagem)) {
      setAlertaDistanciaAberto(true)
      return
    }
    toast.error(mensagem)
  }

  async function aoCheckIn() {
    if (!plantaoAtivo || !tenantUserId || !profissionalId) return
    setEtapa('gps')
    try {
      const posicao = await obterPosicaoAtual()
      setEtapa('gravando')
      const registro = await registrarCheckIn({
        tenantUserId,
        profissionalId,
        plantao: plantaoAtivo,
        posicao,
      })
      setRegistroAberto(registro)
      setPlantaoSelecionadoId(plantaoAtivo.id)
      toast.success('Check-in registado com sucesso!')
      await carregar()
    } catch (e) {
      tratarErroPonto(e)
    } finally {
      setEtapa('idle')
    }
  }

  async function aoCheckOut() {
    if (!plantaoAtivo || !registroAberto) return
    setEtapa('gps')
    try {
      const posicao = await obterPosicaoAtual()
      setEtapa('gravando')
      await registrarCheckOut({
        registro: registroAberto,
        plantao: plantaoAtivo,
        posicao,
      })
      setRegistroAberto(null)
      toast.success('Check-out registado. Plantão marcado como realizado.')
      await carregar()
    } catch (e) {
      tratarErroPonto(e)
    } finally {
      setEtapa('idle')
    }
  }

  const textoBotaoAcao = useMemo(() => {
    if (etapa === 'gps') return 'A obter localização…'
    if (etapa === 'gravando') return turnoAtivo ? 'A registar saída…' : 'A registar entrada…'
    return turnoAtivo ? 'Fazer Check-out' : 'Fazer Check-in'
  }, [etapa, turnoAtivo])

  if (isLoading || carregando) {
    return (
      <div className="flex min-h-[50dvh] items-center justify-center gap-2 px-4 text-slate-600">
        <Loader2 className="h-6 w-6 animate-spin text-primary-600" aria-hidden />
        A carregar ponto eletrónico…
      </div>
    )
  }

  if (!isMembroProfissional || !profissionalId) {
    return (
      <section className="mx-auto w-full max-w-lg px-1">
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
    <>
      <section className="mx-auto flex w-full max-w-lg flex-col gap-5 px-0 sm:px-1">
        <header className="px-1">
          <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">Ponto eletrónico</h1>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            Registe entrada e saída com validação por GPS. Raio permitido:{' '}
            <strong className="font-semibold text-slate-800">{RAIO_CHECKIN_METROS} m</strong>.
          </p>
        </header>

        {erro ? (
          <div
            className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
            role="alert"
          >
            {erro}
          </div>
        ) : null}

        {plantaoAtivo ? (
          <>
            {!turnoAtivo && plantoesSelecionaveis.length > 1 ? (
              <div className="px-1">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Selecionar plantão
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {plantoesSelecionaveis.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPlantaoSelecionadoId(p.id)}
                      className={cn(
                        'shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                        plantaoAtivo.id === p.id
                          ? 'border-primary-600 bg-primary-600 text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-primary-300',
                      )}
                    >
                      {p.hora_inicio.slice(0, 5)} · {p.setor}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <PontoPlantaoAtualCard
              plantao={plantaoAtivo}
              turnoAtivo={turnoAtivo}
              segundosDecorridos={segundosDecorridos}
              entradaEm={registroAberto?.entrada_em ?? null}
              formatarCronometro={formatarCronometro}
              formatarDataHora={formatarDataHora}
            />

            <div className="sticky bottom-0 z-10 -mx-4 border-t border-slate-200/80 bg-slate-50/95 px-4 py-4 backdrop-blur-sm sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
              {turnoAtivo ? (
                <button
                  type="button"
                  disabled={processando}
                  onClick={() => void aoCheckOut()}
                  className={cn(
                    'flex w-full min-h-13 items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-semibold text-white shadow-lg transition',
                    'bg-red-600 hover:bg-red-700 active:scale-[0.99] disabled:opacity-60',
                  )}
                >
                  {processando ? (
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                  ) : (
                    <Timer className="h-5 w-5" aria-hidden />
                  )}
                  {textoBotaoAcao}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={processando || plantaoAtivo.status === 'realizado'}
                  onClick={() => void aoCheckIn()}
                  className={cn(
                    'flex w-full min-h-14 items-center justify-center gap-2 rounded-2xl px-6 py-5 text-base font-semibold text-white shadow-lg transition',
                    'bg-primary-600 hover:bg-primary-700 active:scale-[0.99] disabled:opacity-60',
                  )}
                >
                  {processando ? (
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                  ) : (
                    <MapPinned className="h-5 w-5" aria-hidden />
                  )}
                  {textoBotaoAcao}
                </button>
              )}
              <p className="mt-2 text-center text-[11px] text-slate-500">
                O GPS do dispositivo será solicitado ao bater o ponto.
              </p>
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-10 text-center shadow-sm">
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

        <div className="pb-2">
          <h2 className="mb-3 px-1 text-sm font-semibold text-slate-900">Últimos registos</h2>
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

      <PontoAlertaDistanciaModal
        aberto={alertaDistanciaAberto}
        hospital={plantaoAtivo?.hospital}
        onFechar={() => setAlertaDistanciaAberto(false)}
      />
    </>
  )
}
