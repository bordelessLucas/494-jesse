import { useCallback, useEffect, useRef, useState } from 'react'

import type { SuporteConversa, SuporteFluxoOpcao, SuporteMensagem } from '../domain/suporte.types'
import { buscarMensagensConversa } from '../infrastructure/suporte.db'
import {
  processarOpcaoFluxo,
  processarTextoLivre,
} from '../infrastructure/suporte.engine'
import { inscreverMensagensConversa } from '../infrastructure/suporte.realtime'

function mesclarMensagens(
  atuais: SuporteMensagem[],
  novas: SuporteMensagem[],
): SuporteMensagem[] {
  const map = new Map(atuais.map((m) => [m.id, m]))
  for (const m of novas) map.set(m.id, m)
  return [...map.values()].sort(
    (a, b) => new Date(a.criadaEm).getTime() - new Date(b.criadaEm).getTime(),
  )
}

export function useSuporteMensagens(params: {
  conversa: SuporteConversa | null
  usuarioId: string | null | undefined
  onConversaChange: (conversa: SuporteConversa) => void
  onOpcoesChange: (opcoes: SuporteFluxoOpcao[]) => void
}) {
  const { conversa, usuarioId, onConversaChange, onOpcoesChange } = params
  const [mensagens, setMensagens] = useState<SuporteMensagem[]>([])
  const [carregando, setCarregando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const listaRef = useRef<HTMLDivElement>(null)

  const carregar = useCallback(async (conversaId: string) => {
    setCarregando(true)
    setErro(null)
    try {
      const rows = await buscarMensagensConversa(conversaId)
      setMensagens(rows)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar mensagens.')
      setMensagens([])
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    if (!conversa?.id) {
      setMensagens([])
      return
    }
    void carregar(conversa.id)
  }, [conversa?.id, carregar])

  useEffect(() => {
    if (!conversa?.id) return

    return inscreverMensagensConversa(conversa.id, (msg) => {
      setMensagens((prev) => mesclarMensagens(prev, [msg]))
    })
  }, [conversa?.id])

  useEffect(() => {
    listaRef.current?.scrollTo({
      top: listaRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [mensagens, enviando])

  const enviarOpcao = useCallback(
    async (opcaoId: string) => {
      if (!conversa || !usuarioId || enviando) return
      setEnviando(true)
      setErro(null)
      try {
        const resultado = await processarOpcaoFluxo({
          conversa,
          opcaoId,
          usuarioId,
        })
        setMensagens((prev) => mesclarMensagens(prev, resultado.mensagensNovas))
        onConversaChange(resultado.conversa)
        onOpcoesChange(resultado.opcoesAtuais)
      } catch (e) {
        setErro(e instanceof Error ? e.message : 'Erro ao enviar opção.')
      } finally {
        setEnviando(false)
      }
    },
    [conversa, enviando, onConversaChange, onOpcoesChange, usuarioId],
  )

  const enviarTexto = useCallback(
    async (texto: string) => {
      if (!conversa || !usuarioId || enviando) return
      setEnviando(true)
      setErro(null)
      try {
        const resultado = await processarTextoLivre({
          conversa,
          texto,
          usuarioId,
        })
        setMensagens((prev) => mesclarMensagens(prev, resultado.mensagensNovas))
        onConversaChange(resultado.conversa)
        onOpcoesChange(resultado.opcoesAtuais)
      } catch (e) {
        setErro(e instanceof Error ? e.message : 'Erro ao enviar mensagem.')
      } finally {
        setEnviando(false)
      }
    },
    [conversa, enviando, onConversaChange, onOpcoesChange, usuarioId],
  )

  return {
    mensagens,
    carregando,
    enviando,
    erro,
    listaRef,
    enviarOpcao,
    enviarTexto,
    recarregar: carregar,
  }
}
