import { create } from 'zustand'

import {
  buscarPlantoesParaConfirmar,
  rpcConfirmarPlantao,
  type PlantaoConfirmacaoPendente,
} from '../lib/escalas/confirmacaoEscalaDb'

type LoadingPorPlantao = Record<string, 'confirmar' | 'recusar' | null>

type ConfirmacaoEscalaState = {
  plantoes: PlantaoConfirmacaoPendente[]
  isLoading: boolean
  error: string | null
  loadingPorPlantao: LoadingPorPlantao
  profissionalId: string | null
  tenantUserId: string | null
  carregar: (profissionalId: string, tenantUserId: string) => Promise<void>
  confirmarPlantao: (
    plantaoId: string,
    aceitar: boolean,
    motivo?: string,
  ) => Promise<{ success: boolean; message: string }>
  removerPlantaoLocal: (plantaoId: string) => void
  reset: () => void
}

export const useConfirmacaoEscalaStore = create<ConfirmacaoEscalaState>((set, get) => ({
  plantoes: [],
  isLoading: false,
  error: null,
  loadingPorPlantao: {},
  profissionalId: null,
  tenantUserId: null,

  carregar: async (profissionalId, tenantUserId) => {
    set({ isLoading: true, error: null, profissionalId, tenantUserId })
    try {
      const rows = await buscarPlantoesParaConfirmar(profissionalId, tenantUserId)
      set({ plantoes: rows, isLoading: false })
    } catch (e) {
      set({
        plantoes: [],
        isLoading: false,
        error: e instanceof Error ? e.message : 'Erro ao carregar confirmações.',
      })
    }
  },

  confirmarPlantao: async (plantaoId, aceitar, motivo) => {
    const chaveLoading = aceitar ? 'confirmar' : 'recusar'
    set((s) => ({
      loadingPorPlantao: { ...s.loadingPorPlantao, [plantaoId]: chaveLoading },
    }))

    const snapshot = get().plantoes

    try {
      const result = await rpcConfirmarPlantao(plantaoId, aceitar, motivo)
      if (result.success) {
        get().removerPlantaoLocal(plantaoId)
      }
      return result
    } catch (e) {
      set({ plantoes: snapshot })
      const msg = e instanceof Error ? e.message : 'Erro ao processar confirmação.'
      return { success: false, message: msg }
    } finally {
      set((s) => ({
        loadingPorPlantao: { ...s.loadingPorPlantao, [plantaoId]: null },
      }))
    }
  },

  removerPlantaoLocal: (plantaoId) => {
    set((s) => ({
      plantoes: s.plantoes.filter((p) => p.id !== plantaoId),
    }))
  },

  reset: () => {
    set({
      plantoes: [],
      isLoading: false,
      error: null,
      loadingPorPlantao: {},
      profissionalId: null,
      tenantUserId: null,
    })
  },
}))

/** Hook para profissional confirmar/recusar plantões atribuídos. */
export function useConfirmacaoEscala() {
  const plantoes = useConfirmacaoEscalaStore((s) => s.plantoes)
  const isLoading = useConfirmacaoEscalaStore((s) => s.isLoading)
  const error = useConfirmacaoEscalaStore((s) => s.error)
  const loadingPorPlantao = useConfirmacaoEscalaStore((s) => s.loadingPorPlantao)
  const carregar = useConfirmacaoEscalaStore((s) => s.carregar)
  const confirmarPlantao = useConfirmacaoEscalaStore((s) => s.confirmarPlantao)
  const reset = useConfirmacaoEscalaStore((s) => s.reset)

  return {
    plantoes,
    totalPendentes: plantoes.length,
    isLoading,
    error,
    loadingPorPlantao,
    carregar,
    confirmarPlantao,
    reset,
  }
}
