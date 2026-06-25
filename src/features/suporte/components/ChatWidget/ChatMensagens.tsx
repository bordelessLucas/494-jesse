import { ChevronLeft, Loader2, MoreHorizontal, Send, X } from 'lucide-react'
import { useState } from 'react'

import type { SuporteFluxoOpcao, SuporteMensagem } from '../../domain/suporte.types'
import { Marcadagua } from './ChatInicio'
import { BlocoMensagemSuporte } from './suporteUi'

export function CabecalhoChat({
  aoVoltar,
  aoFechar,
  mostrarMenu,
}: {
  aoVoltar: () => void
  aoFechar: () => void
  mostrarMenu: boolean
}) {
  return (
    <div className="flex shrink-0 items-center justify-between bg-primary-600 px-2 py-2 text-white">
      <button
        type="button"
        onClick={aoVoltar}
        className="rounded-md p-2 hover:bg-white/10"
        aria-label="Voltar"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <div className="flex items-center gap-1">
        {mostrarMenu ? (
          <button
            type="button"
            className="rounded-md p-2 hover:bg-white/10"
            aria-label="Menu"
            disabled
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
        ) : null}
        <button
          type="button"
          onClick={aoFechar}
          className="rounded-md p-2 hover:bg-white/10"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

type ChatMensagensProps = {
  mensagens: SuporteMensagem[]
  opcoesAtuais: SuporteFluxoOpcao[]
  carregando: boolean
  enviando: boolean
  erro: string | null
  listaRef: React.RefObject<HTMLDivElement | null>
  statusConversa: string
  onVoltar: () => void
  onFechar: () => void
  onEnviarTexto: (texto: string) => void
  onEnviarOpcao: (opcaoId: string) => void
}

export function ChatMensagens({
  mensagens,
  opcoesAtuais,
  carregando,
  enviando,
  erro,
  listaRef,
  statusConversa,
  onVoltar,
  onFechar,
  onEnviarTexto,
  onEnviarOpcao,
}: ChatMensagensProps) {
  const [rascunho, setRascunho] = useState('')

  const ultimaMsgId = mensagens[mensagens.length - 1]?.id
  const mostrarOpcoes =
    opcoesAtuais.length > 0 &&
    statusConversa !== 'aberta' &&
    statusConversa !== 'resolvida'

  function handleEnviar() {
    const t = rascunho.trim()
    if (!t) return
    setRascunho('')
    onEnviarTexto(t)
  }

  return (
    <>
      <CabecalhoChat aoVoltar={onVoltar} aoFechar={onFechar} mostrarMenu />
      <div
        ref={listaRef}
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto bg-white px-3 py-3"
        aria-live="polite"
        aria-relevant="additions"
      >
        {carregando ? (
          <div className="flex justify-center py-8 text-sm text-slate-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            Carregando mensagens…
          </div>
        ) : null}

        {mensagens.map((m) => (
          <BlocoMensagemSuporte
            key={m.id}
            de={m.autorTipo === 'usuario' ? 'usuario' : 'outro'}
            texto={m.texto}
          />
        ))}

        {mostrarOpcoes && ultimaMsgId ? (
          <div className="flex flex-wrap gap-2 pl-0.5 pt-1">
            {opcoesAtuais.map((opt) => (
              <button
                key={opt.id}
                type="button"
                disabled={enviando}
                onClick={() => onEnviarOpcao(opt.id)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-left text-xs font-medium text-primary-600 hover:bg-primary-50 disabled:opacity-60"
              >
                {opt.label}
              </button>
            ))}
          </div>
        ) : null}

        {enviando ? (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-500">
              Enviando…
            </div>
          </div>
        ) : null}

        {erro ? (
          <p className="rounded-lg border border-danger-200 bg-danger-50 px-3 py-2 text-xs text-danger-800">
            {erro}
          </p>
        ) : null}
      </div>
      <Marcadagua />
      <div className="border-t border-slate-100 bg-white px-2 pb-3 pt-2">
        <div className="flex items-end gap-1 rounded-xl border border-slate-200 bg-slate-50/80 px-2 py-1.5">
          <textarea
            rows={1}
            placeholder="Digite aqui — Enter envia, Shift+Enter quebra linha"
            value={rascunho}
            disabled={enviando || statusConversa === 'resolvida'}
            onChange={(e) => setRascunho(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleEnviar()
              }
            }}
            className="max-h-24 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 disabled:opacity-60"
          />
          <button
            type="button"
            disabled={enviando || !rascunho.trim() || statusConversa === 'resolvida'}
            onClick={handleEnviar}
            className="rounded-lg bg-primary-600 p-2 text-white hover:bg-primary-700 disabled:opacity-50"
            aria-label="Enviar mensagem"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  )
}
