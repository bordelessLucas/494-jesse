import {
  ArrowLeftRight,
  Calendar,
  Clock3,
  DollarSign,
  Loader2,
  MapPin,
  RefreshCw,
} from 'lucide-react'
import { ptBR } from 'date-fns/locale'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'

import { cn } from '../../lib/cn'
import { formatarDataSegura } from '../../lib/datas/formatacaoSegura'
import { dataLocalAPartirDeIsoData } from '../../lib/escalas/plantoesDb'
import {
  buscarPlantoesMural,
  candidatarSePlantao,
  type PlantaoMuralRow,
} from '../../lib/escalas/muralTrocasDb'
import { supabase } from '../../lib/supabase'
import { useTenantUserId } from '../../hooks/useTenantUserId'

function formatarDataLonga(isoData: string): string {
  const d = dataLocalAPartirDeIsoData(isoData)
  const texto = formatarDataSegura(d, "dd 'de' MMMM", { locale: ptBR, fallback: '—' })
  if (!texto || texto === '—') return '—'
  return texto.slice(0, 1).toUpperCase() + texto.slice(1)
}

function formatarHorario(inicio: string, fim: string): string {
  const a = String(inicio).slice(0, 5)
  const b = String(fim).slice(0, 5)
  return `${a} — ${b}`
}

function formatarValor(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(valor)
}

export function MuralTrocasPage() {
  const { user, tenantUserId, isLoading } = useTenantUserId()
  const [carregando, setCarregando] = useState(true)
  const [itens, setItens] = useState<PlantaoMuralRow[]>([])
  const [erro, setErro] = useState<string | null>(null)
  const [assumindoId, setAssumindoId] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    if (!user?.id) return
    setCarregando(true)
    setErro(null)
    try {
      const rows = await buscarPlantoesMural()
      setItens(Array.isArray(rows) ? rows : [])
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar mural.')
    } finally {
      setCarregando(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (isLoading) return
    void carregar()
  }, [carregar, isLoading])

  useEffect(() => {
    if (isLoading || !user?.id || !tenantUserId) return

    const canal = supabase
      .channel(`mural-trocas-lista-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'plantoes',
          filter: `user_id=eq.${tenantUserId}`,
        },
        (payload) => {
          const novo = payload.new as { disponivel_mural?: boolean } | null
          const antigo = payload.old as { disponivel_mural?: boolean } | null
          const entrouNoMural = novo?.disponivel_mural === true
          const saiuDoMural = antigo?.disponivel_mural === true && !novo?.disponivel_mural

          if (entrouNoMural || saiuDoMural || payload.eventType === 'DELETE') {
            void carregar()
          }
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(canal)
    }
  }, [carregar, isLoading, tenantUserId, user?.id])

  const assumirPlantao = useCallback(
    async (plantao: PlantaoMuralRow) => {
      if (!user?.id) return
      setAssumindoId(plantao.id)
      try {
        if (!plantao.profissional_id) {
          toast.error('Este plantão não tem anunciante vinculado.')
          return
        }

        await candidatarSePlantao({
          plantaoId: plantao.id,
          anuncianteProfissionalId: plantao.profissional_id,
        })

        toast.success('Solicitação enviada! Aguarde aprovação da coordenação.')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao enviar solicitação.')
      } finally {
        setAssumindoId(null)
      }
    },
    [user?.id],
  )

  return (
    <div className="space-y-5">
      <header className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-violet-50 text-violet-700">
              <ArrowLeftRight className="h-6 w-6" aria-hidden />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Marketplace de plantões
              </p>
              <h1 className="text-2xl font-semibold text-slate-900">Mural de Trocas</h1>
              <p className="mt-1 text-sm text-slate-600">
                Veja plantões anunciados e envie uma solicitação para assumir.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void carregar()}
            disabled={carregando}
            className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50 md:self-auto"
          >
            {carregando ? (
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" aria-hidden />
            ) : (
              <RefreshCw className="h-4 w-4 text-slate-500" aria-hidden />
            )}
            Atualizar
          </button>
        </div>
      </header>

      {erro ? (
        <div className="rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-800">
          {erro}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {carregando ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
            Carregando plantões…
          </div>
        ) : itens.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
            Nenhum plantão anunciado no momento.
          </div>
        ) : (
          itens.map((plantao) => {
            const hospital = plantao.locais?.nome_fantasia?.trim() ?? 'Hospital'
            const setor = plantao.setores?.nome?.trim() ?? 'Setor'
            const anunciante = plantao.profissionais?.nome?.trim()
            const valor = plantao.valor_plantao ?? 0
            const isAssumindo = assumindoId === plantao.id

            return (
              <article
                key={plantao.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {formatarDataLonga(plantao.data_plantao)}
                    </p>
                    <h2 className="mt-1 truncate text-lg font-semibold text-slate-900">
                      {hospital}
                    </h2>
                    <p className="mt-1 text-sm font-medium text-slate-700">{setor}</p>
                    {anunciante ? (
                      <p className="mt-1 text-xs text-slate-500">
                        Anunciado por {anunciante}
                      </p>
                    ) : null}
                  </div>

                  <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                    <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden />
                    Troca
                  </span>
                </div>

                <div className="mt-4 grid gap-2 text-sm text-slate-700">
                  <div className="inline-flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-slate-400" aria-hidden />
                    {formatarHorario(plantao.hora_inicio, plantao.hora_fim)}
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-400" aria-hidden />
                    {hospital}
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" aria-hidden />
                    {setor}
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-slate-400" aria-hidden />
                    {formatarValor(valor)}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isAssumindo}
                  onClick={() => void assumirPlantao(plantao)}
                  className={cn(
                    'mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700',
                    isAssumindo && 'opacity-60',
                  )}
                >
                  {isAssumindo ? 'Enviando…' : 'Assumir Plantão'}
                </button>
              </article>
            )
          })
        )}
      </section>
    </div>
  )
}
