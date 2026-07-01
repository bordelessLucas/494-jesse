import { Link } from 'react-router-dom'
import { ChevronLeft, Send, X } from 'lucide-react'

import { Marcadagua } from './ChatInicio'

type ChatFluxoProps = {
  onVoltar: () => void
  onFechar: () => void
  onIniciarChat: () => void
  iniciando: boolean
}

export function ChatFluxo({ onVoltar, onFechar, onIniciarChat, iniciando }: ChatFluxoProps) {
  return (
    <>
      <div className="relative flex flex-1 flex-col bg-primary-600 px-3 pb-4 pt-2">
        <div className="flex items-center justify-between px-1 py-2 text-white">
          <button
            type="button"
            onClick={onVoltar}
            className="rounded-md p-2 hover:bg-white/10"
            aria-label="Voltar"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onFechar}
            className="rounded-md p-2 hover:bg-white/10"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-1 flex flex-1 flex-col gap-3 overflow-y-auto px-1">
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-center text-sm leading-relaxed text-slate-800">
              Os dados pessoais coletados neste atendimento serão utilizados com a exclusiva
              finalidade de seu atendimento.
            </p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-center text-sm leading-relaxed text-slate-800">
              Para mais informações, consulte a nossa{' '}
              <Link
                to="/suporte/politica-privacidade"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary-700 underline"
              >
                Política de Privacidade
              </Link>{' '}
              e os nossos{' '}
              <Link
                to="/suporte/termos-uso"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary-700 underline"
              >
                Termos de Uso
              </Link>
              .
            </p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <button
              type="button"
              disabled={iniciando}
              onClick={onIniciarChat}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-60"
            >
              <Send className="h-4 w-4" aria-hidden />
              {iniciando ? 'Abrindo chat…' : 'Iniciar chat'}
            </button>
          </div>
        </div>
      </div>
      <Marcadagua />
    </>
  )
}
