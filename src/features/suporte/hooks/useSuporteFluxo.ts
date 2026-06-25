import { useCallback, useState } from 'react'

import type { SuporteConversa, SuporteFluxoOpcao } from '../domain/suporte.types'
import { carregarOpcoesAtuais } from '../infrastructure/suporte.engine'

/** Opções do fluxo guiado para a conversa atual. */
export function useSuporteFluxo(conversa: SuporteConversa | null) {
  const [opcoes, setOpcoes] = useState<SuporteFluxoOpcao[]>([])
  const [carregando, setCarregando] = useState(false)

  const recarregar = useCallback(async () => {
    if (!conversa) {
      setOpcoes([])
      return
    }
    setCarregando(true)
    try {
      const rows = await carregarOpcoesAtuais(conversa)
      setOpcoes(rows)
    } finally {
      setCarregando(false)
    }
  }, [conversa])

  return { opcoes, setOpcoes, carregando, recarregar }
}
