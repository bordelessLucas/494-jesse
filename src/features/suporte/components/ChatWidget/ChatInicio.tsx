import { Home, MessageCircle, Send, X } from 'lucide-react'

import { BrandedLogoOrInitial } from '../../../../components/branding/BrandedLogoOrInitial'
import { cn } from '../../../../lib/cn'

type ChatInicioProps = {
  onNovoAtendimento: () => void
  onFechar: () => void
  onHistorico: () => void
}

export function ChatInicio({ onNovoAtendimento, onFechar, onHistorico }: ChatInicioProps) {
  return (
    <>
      <div className="relative flex flex-1 flex-col bg-primary-600 px-4 pb-5 pt-3">
        <button
          type="button"
          onClick={onFechar}
          className="absolute right-3 top-3 rounded-md p-1.5 text-white/90 hover:bg-white/10"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="mt-8 flex items-start gap-2 pr-8 text-sm leading-snug text-white">
          <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
          <p>
            Estamos <strong className="font-semibold">Online</strong>, diga algo para iniciar uma
            conversa com um de nossos analistas!
          </p>
        </div>
        <div className="mt-6 flex flex-1 items-center">
          <button
            type="button"
            onClick={onNovoAtendimento}
            className="w-full rounded-xl bg-white p-4 text-left shadow-md transition hover:bg-slate-50"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">Novo atendimento</p>
                <p className="mt-1 text-sm text-slate-500">Em que podemos te ajudar?</p>
              </div>
              <span
                className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white ring-2 ring-white/30"
                aria-hidden
              >
                <Send className="h-4 w-4" />
              </span>
            </div>
          </button>
        </div>
      </div>
      <RodapeNavegacao telaAtiva="home" onHome={() => {}} onMensagens={onHistorico} />
    </>
  )
}

export function RodapeNavegacao({
  telaAtiva,
  onHome,
  onMensagens,
}: {
  telaAtiva: 'home' | 'mensagens'
  onHome: () => void
  onMensagens: () => void
}) {
  return (
    <div className="shrink-0 border-t border-slate-100 bg-white px-6 pb-2 pt-3">
      <div className="flex items-center justify-center gap-14">
        <button
          type="button"
          onClick={onHome}
          className={cn(
            'rounded-lg p-2 transition-colors',
            telaAtiva === 'home' ? 'text-primary-600' : 'text-slate-400 hover:text-slate-600',
          )}
          aria-label="Início"
        >
          <Home className="h-6 w-6" strokeWidth={telaAtiva === 'home' ? 2.5 : 2} />
        </button>
        <button
          type="button"
          onClick={onMensagens}
          className={cn(
            'rounded-lg p-2 transition-colors',
            telaAtiva === 'mensagens'
              ? 'text-primary-600'
              : 'text-slate-400 hover:text-slate-600',
          )}
          aria-label="Mensagens"
        >
          <MessageCircle
            className="h-6 w-6"
            strokeWidth={telaAtiva === 'mensagens' ? 2.5 : 2}
          />
        </button>
      </div>
      <Marcadagua />
    </div>
  )
}

export function Marcadagua() {
  return (
    <div className="flex items-center justify-center gap-2 py-2 text-[10px] text-slate-400">
      <BrandedLogoOrInitial className="h-6 w-6 shrink-0 rounded-md" surface="light" alt="" />
      <span className="leading-tight">PlantãoCheck Suporte</span>
    </div>
  )
}
