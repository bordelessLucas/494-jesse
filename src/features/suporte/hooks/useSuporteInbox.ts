import { useCallback, useEffect, useState } from 'react'

import type { StatusConversaSuporte, SuporteConversaResumo } from '../domain/suporte.types'
import {
  buscarConversaPorId,
  buscarConversasInbox,
  buscarMensagensConversa,
} from '../infrastructure/suporte.db'
import {
  marcarConversaResolvida,
  responderComoAnalista,
} from '../infrastructure/suporte.engine'
import { inscreverConversasInbox, inscreverMensagensConversa } from '../infrastructure/suporte.realtime'
import type { SuporteConversa, SuporteMensagem } from '../domain/suporte.types'

export function useSuporteInbox(
  tenantUserId: string | null | undefined,
  analistaId: string | null | undefined,
  conversaInicialId?: string | null,
) {
  const [filtroStatus, setFiltroStatus] = useState<StatusConversaSuporte | 'todas'>('aberta')
  const [conversas, setConversas] = useState<SuporteConversaResumo[]>([])
  const [selecionadaId, setSelecionadaId] = useState<string | null>(conversaInicialId ?? null)
  const [conversaSelecionada, setConversaSelecionada] = useState<SuporteConversa | null>(null)
  const [mensagens, setMensagens] = useState<SuporteMensagem[]>([])
  const [carregandoLista, setCarregandoLista] = useState(false)
  const [carregandoChat, setCarregandoChat] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const carregarLista = useCallback(async () => {
    if (!tenantUserId) return
    setCarregandoLista(true)
    setErro(null)
    try {
      const rows = await buscarConversasInbox(tenantUserId, filtroStatus)
      setConversas(rows)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar inbox.')
      setConversas([])
    } finally {
      setCarregandoLista(false)
    }
  }, [filtroStatus, tenantUserId])

  const carregarConversa = useCallback(async (conversaId: string) => {
    setCarregandoChat(true)
    try {
      const [conv, msgs] = await Promise.all([
        buscarConversaPorId(conversaId),
        buscarMensagensConversa(conversaId),
      ])
      setConversaSelecionada(conv)
      setMensagens(msgs)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar conversa.')
    } finally {
      setCarregandoChat(false)
    }
  }, [])

  useEffect(() => {
    void carregarLista()
  }, [carregarLista])

  useEffect(() => {
    if (!tenantUserId) return
    return inscreverConversasInbox(tenantUserId, () => {
      void carregarLista()
    })
  }, [carregarLista, tenantUserId])

  useEffect(() => {
    if (!selecionadaId) {
      setConversaSelecionada(null)
      setMensagens([])
      return
    }
    void carregarConversa(selecionadaId)
  }, [carregarConversa, selecionadaId])

  useEffect(() => {
    if (!selecionadaId) return
    return inscreverMensagensConversa(selecionadaId, (msg) => {
      setMensagens((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev
        return [...prev, msg]
      })
    })
  }, [selecionadaId])

  const responder = useCallback(
    async (texto: string) => {
      if (!conversaSelecionada || !analistaId || enviando) return
      setEnviando(true)
      setErro(null)
      try {
        const msg = await responderComoAnalista({
          conversa: conversaSelecionada,
          texto,
          analistaId,
        })
        setMensagens((prev) => [...prev, msg])
        const atualizada = { ...conversaSelecionada, status: 'aguardando_usuario' as const }
        setConversaSelecionada(atualizada)
        void carregarLista()
      } catch (e) {
        setErro(e instanceof Error ? e.message : 'Erro ao responder.')
      } finally {
        setEnviando(false)
      }
    },
    [analistaId, carregarLista, conversaSelecionada, enviando],
  )

  const resolver = useCallback(async () => {
    if (!conversaSelecionada || enviando) return
    setEnviando(true)
    try {
      const atualizada = await marcarConversaResolvida(conversaSelecionada.id)
      setConversaSelecionada(atualizada)
      void carregarLista()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao resolver conversa.')
    } finally {
      setEnviando(false)
    }
  }, [carregarLista, conversaSelecionada, enviando])

  return {
    filtroStatus,
    setFiltroStatus,
    conversas,
    selecionadaId,
    setSelecionadaId,
    conversaSelecionada,
    mensagens,
    carregandoLista,
    carregandoChat,
    enviando,
    erro,
    responder,
    resolver,
    recarregarLista: carregarLista,
  }
}
