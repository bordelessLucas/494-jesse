import { useCallback, useRef, useState } from 'react'

import { useTenantUserId } from '../../../../hooks/useTenantUserId'
import type { TelaSuporte } from '../../domain/suporte.types'
import { useSuporteConversa } from '../../hooks/useSuporteConversa'
import { useSuporteMensagens } from '../../hooks/useSuporteMensagens'
import { buscarConversaPorId } from '../../infrastructure/suporte.db'
import { carregarOpcoesAtuais } from '../../infrastructure/suporte.engine'
import { ChatFluxo } from './ChatFluxo'
import { ChatHistorico } from './ChatHistorico'
import { ChatInicio } from './ChatInicio'
import { ChatMensagens } from './ChatMensagens'
import { useFocusTrap } from './suporteUi'

export function SuporteChatWidget() {
  const { user, tenantUserId } = useTenantUserId()
  const usuarioId = user?.id

  const [painelAberto, setPainelAberto] = useState(false)
  const [tela, setTela] = useState<TelaSuporte>('inicio')
  const [iniciandoChat, setIniciandoChat] = useState(false)
  const painelRef = useRef<HTMLDivElement>(null)

  const {
    conversa,
    setConversa,
    historico,
    opcoesAtuais,
    setOpcoesAtuais,
    garantirConversaAtiva,
    recarregarHistorico,
  } = useSuporteConversa(usuarioId, tenantUserId)

  const {
    mensagens,
    carregando: carregandoMsgs,
    enviando,
    erro: erroMsgs,
    listaRef,
    enviarOpcao,
    enviarTexto,
    recarregar: recarregarMsgs,
  } = useSuporteMensagens({
    conversa,
    usuarioId,
    onConversaChange: setConversa,
    onOpcoesChange: setOpcoesAtuais,
  })

  useFocusTrap(painelAberto, painelRef)

  const fecharPainel = useCallback(() => {
    setPainelAberto(false)
    setTela('inicio')
  }, [])

  const abrirChatExistente = useCallback(
    async (conversaId: string) => {
      try {
        const conv = await buscarConversaPorId(conversaId)
        if (!conv) return
        setConversa(conv)
        const opcoes = await carregarOpcoesAtuais(conv)
        setOpcoesAtuais(opcoes)
        setTela('chat')
        void recarregarMsgs(conv.id)
      } catch {
        // ignorar
      }
    },
    [recarregarMsgs, setConversa, setOpcoesAtuais],
  )

  const handleIniciarChat = useCallback(async () => {
    setIniciandoChat(true)
    try {
      await garantirConversaAtiva()
      setTela('chat')
      void recarregarHistorico()
    } catch {
      // erro já em useSuporteConversa
    } finally {
      setIniciandoChat(false)
    }
  }, [garantirConversaAtiva, recarregarHistorico])

  return (
    <div className="no-print pointer-events-none fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] z-50 flex flex-col items-end gap-3 print:hidden sm:bottom-6 sm:right-6">
      {painelAberto ? (
        <div
          ref={painelRef}
          className="pointer-events-auto flex h-[min(520px,78dvh)] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/80"
          role="dialog"
          aria-modal="true"
          aria-label="Suporte PlantãoCheck"
        >
          {tela === 'inicio' ? (
            <ChatInicio
              onNovoAtendimento={() => setTela('privacidade')}
              onFechar={fecharPainel}
              onHistorico={() => {
                void recarregarHistorico()
                setTela('historico')
              }}
            />
          ) : null}

          {tela === 'privacidade' ? (
            <ChatFluxo
              onVoltar={() => setTela('inicio')}
              onFechar={fecharPainel}
              onIniciarChat={() => void handleIniciarChat()}
              iniciando={iniciandoChat}
            />
          ) : null}

          {tela === 'historico' ? (
            <ChatHistorico
              historico={historico}
              onVoltar={() => setTela('inicio')}
              onFechar={fecharPainel}
              onAbrirConversa={(id) => void abrirChatExistente(id)}
            />
          ) : null}

          {tela === 'chat' && conversa ? (
            <ChatMensagens
              mensagens={mensagens}
              opcoesAtuais={opcoesAtuais}
              carregando={carregandoMsgs}
              enviando={enviando}
              erro={erroMsgs}
              listaRef={listaRef}
              statusConversa={conversa.status}
              onVoltar={() => setTela('inicio')}
              onFechar={fecharPainel}
              onEnviarTexto={(t) => void enviarTexto(t)}
              onEnviarOpcao={(id) => void enviarOpcao(id)}
            />
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => {
          setPainelAberto((aberto) => {
            if (!aberto) setTela('inicio')
            return !aberto
          })
        }}
        className="pointer-events-auto inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full bg-primary-950 px-4 py-2 text-sm font-medium tracking-tight text-white shadow-xl ring-2 ring-primary-700/50 transition hover:bg-primary-900"
        aria-expanded={painelAberto}
        aria-label={painelAberto ? 'Recolher chat de suporte' : 'Abrir chat de suporte'}
      >
        <span className="relative flex h-2.5 w-2.5" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </span>
        Online
      </button>
    </div>
  )
}
