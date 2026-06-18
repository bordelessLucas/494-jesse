import { Megaphone } from 'lucide-react'
import { useEffect } from 'react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

import { useContaMembro } from './useContaMembro'
import { deveIgnorarAlertaMural } from '../lib/escalas/muralTrocasAlertas'
import { supabase } from '../lib/supabase'
import { useNotificacoes } from './useNotificacoes'
import { useSupabaseUser } from './useSupabaseUser'

type PlantaoMuralPayload = {
  id: string
  disponivel_mural?: boolean
  data_plantao?: string
  setor_id?: string
}

function plantaoAcabouDeSerAnunciado(
  anterior: PlantaoMuralPayload | Record<string, unknown> | undefined,
  atual: PlantaoMuralPayload,
): boolean {
  if (!atual.disponivel_mural) return false
  const muralAnterior = anterior?.disponivel_mural
  return muralAnterior === false || muralAnterior === undefined
}

function exibirToastNovoPlantaoMural(dataPlantao?: string) {
  const dataRotulo = dataPlantao
    ? new Date(`${String(dataPlantao).slice(0, 10)}T12:00:00`).toLocaleDateString(
        'pt-BR',
      )
    : null

  toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-lg`}
        role="alert"
      >
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-700">
          <Megaphone className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-amber-950">
            Novo plantão no Mural de Trocas
          </p>
          <p className="mt-1 text-sm text-amber-900/90">
            {dataRotulo
              ? `Um colega anunciou um plantão para ${dataRotulo}.`
              : 'Um colega colocou um plantão disponível para troca.'}{' '}
            Confira o mural para demonstrar interesse.
          </p>
          <Link
            to="/escalas/mural-trocas"
            onClick={() => toast.dismiss(t.id)}
            className="mt-2 inline-flex text-sm font-semibold text-amber-800 underline-offset-2 hover:underline"
          >
            Ver Mural de Trocas
          </Link>
        </div>
        <button
          type="button"
          onClick={() => toast.dismiss(t.id)}
          className="shrink-0 rounded-md px-1 text-amber-700/70 hover:text-amber-900"
          aria-label="Fechar alerta"
        >
          ×
        </button>
      </div>
    ),
    { duration: 7000 },
  )
}

export function useMuralTrocasAlertas(): void {
  const { user, isLoading: authLoading } = useSupabaseUser()
  const { tenantUserId, isLoading: membroLoading } = useContaMembro()
  const notificarNovoPlantaoMural = useNotificacoes((s) => s.notificarNovoPlantaoMural)

  useEffect(() => {
    if (authLoading || membroLoading || !user?.id || !tenantUserId) return

    const canal = supabase
      .channel(`mural-plantoes-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'plantoes',
          filter: `user_id=eq.${tenantUserId}`,
        },
        (payload) => {
          const anterior = payload.old as PlantaoMuralPayload | undefined
          const atual = payload.new as PlantaoMuralPayload

          if (!plantaoAcabouDeSerAnunciado(anterior, atual)) return
          if (deveIgnorarAlertaMural(atual.id)) return

          exibirToastNovoPlantaoMural(atual.data_plantao)
          void notificarNovoPlantaoMural({
            dataPlantao: atual.data_plantao,
          })
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(canal)
    }
  }, [
    authLoading,
    membroLoading,
    notificarNovoPlantaoMural,
    tenantUserId,
    user?.id,
  ])
}
