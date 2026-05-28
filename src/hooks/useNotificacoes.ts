import { create } from 'zustand'

import type { Notificacao } from '../types/notificacaoTypes'

type UseNotificacoesState = {
  notificacoes: Notificacao[]
  enviarNotificacaoNovaEscala: (params: {
    profissionalId: string
    setor: string
    data: string
  }) => void
  marcarComoLida: (id: string) => void
  marcarTodasComoLidas: () => void
}

function createMockNotificacoes(): Notificacao[] {
  const now = new Date()
  const minutesAgo = (minutes: number) =>
    new Date(now.getTime() - minutes * 60_000).toISOString()

  return [
    {
      id: 'notificacao-1',
      usuario_id: 'mock-user',
      titulo: 'Novo Plantão: UTI Pediátrica - 15/Maio',
      mensagem: 'Você recebeu um novo plantão. Confira os detalhes e confirme sua disponibilidade.',
      tipo: 'nova_escala',
      lida: false,
      criadoEm: minutesAgo(8),
      linkAcao: '/minha-agenda',
    },
    {
      id: 'notificacao-2',
      usuario_id: 'mock-user',
      titulo: 'Alteração de Escala: Pronto Socorro - 20/Maio',
      mensagem: 'Houve uma alteração no seu plantão. Verifique o horário atualizado.',
      tipo: 'alteracao_escala',
      lida: false,
      criadoEm: minutesAgo(65),
      linkAcao: '/escalas',
    },
    {
      id: 'notificacao-3',
      usuario_id: 'mock-user',
      titulo: 'Aviso do PlantãoCheck',
      mensagem: 'Mantenha seus dados cadastrais atualizados para evitar problemas no repasse.',
      tipo: 'aviso',
      lida: true,
      criadoEm: minutesAgo(240),
      linkAcao: '/meus-dados',
    },
  ]
}

export const useNotificacoes = create<UseNotificacoesState>((set) => ({
  notificacoes: createMockNotificacoes(),
  enviarNotificacaoNovaEscala: ({ profissionalId, setor, data }) => {
    const now = new Date()
    const id = `notificacao-${now.getTime()}`
    const titulo = `Novo Plantão: ${setor} - ${data}`

    set((state) => ({
      notificacoes: [
        {
          id,
          usuario_id: profissionalId,
          titulo,
          mensagem: 'Você recebeu um novo plantão. Confira os detalhes e confirme sua disponibilidade.',
          tipo: 'nova_escala',
          lida: false,
          criadoEm: now.toISOString(),
          linkAcao: '/minha-agenda',
        },
        ...state.notificacoes,
      ],
    }))
  },
  marcarComoLida: (id) => {
    set((state) => ({
      notificacoes: state.notificacoes.map((notificacao) =>
        notificacao.id === id ? { ...notificacao, lida: true } : notificacao,
      ),
    }))
  },
  marcarTodasComoLidas: () => {
    set((state) => ({
      notificacoes: state.notificacoes.map((notificacao) => ({
        ...notificacao,
        lida: true,
      })),
    }))
  },
}))

