import { useCallback, useEffect, useState } from 'react'

import type { SuporteConversa, SuporteFluxoOpcao } from '../domain/suporte.types'
import {
  buscarConversaAtiva,
  buscarConversasHistorico,
  criarConversa,
} from '../infrastructure/suporte.db'
import {
  carregarOpcoesAtuais,
  enviarMensagemInicialFluxo,
  obterFluxoRaizId,
} from '../infrastructure/suporte.engine'

export function useSuporteConversa(
  usuarioId: string | null | undefined,
  tenantUserId: string | null | undefined,
) {
  const [conversa, setConversa] = useState<SuporteConversa | null>(null)
  const [historico, setHistorico] = useState<SuporteConversa[]>([])
  const [opcoesAtuais, setOpcoesAtuais] = useState<SuporteFluxoOpcao[]>([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const recarregarHistorico = useCallback(async () => {
    if (!usuarioId) {
      setHistorico([])
      return
    }
    try {
      const rows = await buscarConversasHistorico(usuarioId)
      setHistorico(rows)
    } catch {
      setHistorico([])
    }
  }, [usuarioId])

  const garantirConversaAtiva = useCallback(async (): Promise<SuporteConversa> => {
    if (!usuarioId || !tenantUserId) {
      throw new Error('Sessão inválida para abrir o suporte.')
    }

    setCarregando(true)
    setErro(null)
    try {
      let ativa = await buscarConversaAtiva(usuarioId)
      if (!ativa) {
        const raizId = await obterFluxoRaizId()
        ativa = await criarConversa({
          tenantUserId,
          usuarioId,
          fluxoRaizId: raizId,
        })
        const { opcoes } = await enviarMensagemInicialFluxo(ativa)
        setOpcoesAtuais(opcoes)
      } else {
        const opcoes = await carregarOpcoesAtuais(ativa)
        setOpcoesAtuais(opcoes)
      }
      setConversa(ativa)
      return ativa
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao iniciar conversa.'
      setErro(msg)
      throw e
    } finally {
      setCarregando(false)
    }
  }, [tenantUserId, usuarioId])

  useEffect(() => {
    if (!usuarioId) return
    void recarregarHistorico()
  }, [usuarioId, recarregarHistorico])

  return {
    conversa,
    setConversa,
    historico,
    opcoesAtuais,
    setOpcoesAtuais,
    carregando,
    erro,
    garantirConversaAtiva,
    recarregarHistorico,
  }
}
