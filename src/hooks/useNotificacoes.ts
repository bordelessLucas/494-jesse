import { useEffect } from 'react'
import toast from 'react-hot-toast'
import { create } from 'zustand'

import {
  buscarAuthUserIdProfissional,
  buscarNotificacoes,
  inserirNotificacao,
  mapNotificacaoRow,
  marcarComoLida as marcarComoLidaDb,
  marcarTodasComoLidas as marcarTodasComoLidasDb,
  type NotificacaoRow,
} from '../lib/notificacoes/notificacoesDb'
import { obterTenantUserId } from '../lib/escalas/muralTrocasDb'
import { supabase } from '../lib/supabase'
import type { Notificacao } from '../types/notificacaoTypes'
import { useSupabaseUser } from './useSupabaseUser'

type UseNotificacoesState = {
  notificacoes: Notificacao[]
  isLoading: boolean
  usuarioId: string | null
  carregarNotificacoes: (usuarioId: string) => Promise<void>
  adicionarNotificacaoLocal: (notificacao: Notificacao) => void
  enviarNotificacaoNovaEscala: (params: {
    profissionalId: string
    setor: string
    data: string
  }) => Promise<void>
  notificarNovoPlantaoMural: (params?: { dataPlantao?: string }) => Promise<void>
  marcarComoLida: (id: string) => Promise<void>
  marcarTodasComoLidas: () => Promise<void>
}

export const useNotificacoes = create<UseNotificacoesState>((set, get) => ({
  notificacoes: [],
  isLoading: false,
  usuarioId: null,

  carregarNotificacoes: async (usuarioId) => {
    set({ isLoading: true, usuarioId })
    try {
      const rows = await buscarNotificacoes(usuarioId)
      set({ notificacoes: rows, isLoading: false })
    } catch {
      set({ notificacoes: [], isLoading: false })
    }
  },

  adicionarNotificacaoLocal: (notificacao) => {
    set((state) => {
      if (state.notificacoes.some((n) => n.id === notificacao.id)) return state
      return { notificacoes: [notificacao, ...state.notificacoes] }
    })
  },

  enviarNotificacaoNovaEscala: async ({ profissionalId, setor, data }) => {
    const tenantUserId = await obterTenantUserId()
    const authUserId = await buscarAuthUserIdProfissional(profissionalId)
    if (!tenantUserId || !authUserId) return

    const titulo = `Novo Plantão: ${setor} - ${data}`
    try {
      const notificacao = await inserirNotificacao({
        tenantUserId,
        usuarioId: authUserId,
        titulo,
        mensagem:
          'Você recebeu um novo plantão. Confira os detalhes e confirme sua disponibilidade.',
        tipo: 'nova_escala',
        linkAcao: '/minha-agenda',
      })
      if (authUserId === get().usuarioId) {
        get().adicionarNotificacaoLocal(notificacao)
      }
    } catch (e) {
      console.error('Falha ao enviar notificação de escala:', e)
    }
  },

  notificarNovoPlantaoMural: async ({ dataPlantao } = {}) => {
    const usuarioId = get().usuarioId
    const tenantUserId = await obterTenantUserId()
    if (!usuarioId || !tenantUserId) return

    const dataRotulo = dataPlantao
      ? new Date(`${String(dataPlantao).slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR')
      : 'nova data'
    const titulo = 'Novo plantão no Mural de Trocas'

    try {
      await inserirNotificacao({
        tenantUserId,
        usuarioId,
        titulo,
        mensagem: `Um colega anunciou um plantão (${dataRotulo}) no mural. Veja quem pode assumir.`,
        tipo: 'novo_mural',
        linkAcao: '/escalas/mural-trocas',
      })
    } catch (e) {
      console.error('Falha ao registrar notificação do mural:', e)
    }
  },

  marcarComoLida: async (id) => {
    try {
      await marcarComoLidaDb(id)
      set((state) => ({
        notificacoes: state.notificacoes.map((notificacao) =>
          notificacao.id === id ? { ...notificacao, lida: true } : notificacao,
        ),
      }))
    } catch (e) {
      console.error('Falha ao marcar notificação como lida:', e)
    }
  },

  marcarTodasComoLidas: async () => {
    const usuarioId = get().usuarioId
    if (!usuarioId) return
    try {
      await marcarTodasComoLidasDb(usuarioId)
      set((state) => ({
        notificacoes: state.notificacoes.map((notificacao) => ({
          ...notificacao,
          lida: true,
        })),
      }))
    } catch (e) {
      console.error('Falha ao marcar todas como lidas:', e)
    }
  },
}))

/** Carrega notificações e subscreve Realtime para INSERT do utilizador logado. */
export function useNotificacoesRealtime(): void {
  const { user, isLoading } = useSupabaseUser()
  const carregarNotificacoes = useNotificacoes((s) => s.carregarNotificacoes)
  const adicionarNotificacaoLocal = useNotificacoes((s) => s.adicionarNotificacaoLocal)

  useEffect(() => {
    if (isLoading || !user?.id) return

    void carregarNotificacoes(user.id)

    const canal = supabase
      .channel(`notificacoes-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificacoes',
          filter: `usuario_id=eq.${user.id}`,
        },
        (payload) => {
          const notificacao = mapNotificacaoRow(payload.new as NotificacaoRow)
          adicionarNotificacaoLocal(notificacao)
          if (notificacao.tipo !== 'novo_mural') {
            toast(`Nova Notificação: ${notificacao.titulo}`)
          }
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(canal)
    }
  }, [isLoading, user?.id, carregarNotificacoes, adicionarNotificacaoLocal])
}
