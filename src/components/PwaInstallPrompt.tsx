import { Download, Share, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import toast from 'react-hot-toast'

import {
  dispensarToastInstalacao,
  foiToastInstalacaoDispensado,
  isIosSafari,
  isMobileDevice,
  isPwaInstalado,
  type BeforeInstallPromptEvent,
} from '../lib/pwa/installPrompt'

const DELAY_MS = 2000

function mostrarToastInstalacao(
  deferredPrompt: BeforeInstallPromptEvent | null,
  isIos: boolean,
) {
  toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } pointer-events-auto w-full max-w-sm ug-card p-4 shadow-xl shadow-slate-300/30 ring-1 ring-black/5`}
      >
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-600 text-white">
            <Download className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ug-petrol">Instale o Unique Gestor</p>
            <p className="mt-1 text-xs leading-relaxed text-ug-muted">
              {deferredPrompt
                ? 'Adicione o app à tela inicial para acesso rápido, mesmo offline.'
                : isIos
                  ? 'Toque em Compartilhar e depois em "Adicionar à Tela de Início".'
                  : 'Adicione o app à tela inicial para acesso rápido ao Unique Gestor.'}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {deferredPrompt ? (
                <button
                  type="button"
                  onClick={() => {
                    void (async () => {
                      await deferredPrompt.prompt()
                      const { outcome } = await deferredPrompt.userChoice
                      if (outcome === 'accepted') {
                        dispensarToastInstalacao()
                      }
                      toast.dismiss(t.id)
                    })()
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700"
                >
                  <Download className="h-3.5 w-3.5" aria-hidden />
                  Instalar
                </button>
              ) : isIos ? (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">
                  <Share className="h-3.5 w-3.5" aria-hidden />
                  Compartilhar → Tela de Início
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  dispensarToastInstalacao()
                  toast.dismiss(t.id)
                }}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Agora não
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              dispensarToastInstalacao()
              toast.dismiss(t.id)
            }}
            className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    ),
    { duration: Infinity, id: 'pwa-install-prompt' },
  )
}

export function PwaInstallPrompt() {
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null)
  const toastExibidoRef = useRef(false)

  useEffect(() => {
    if (!isMobileDevice() || isPwaInstalado() || foiToastInstalacaoDispensado()) {
      return
    }

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      deferredPromptRef.current = event as BeforeInstallPromptEvent
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)

    const timer = window.setTimeout(() => {
      if (toastExibidoRef.current) return
      toastExibidoRef.current = true
      mostrarToastInstalacao(deferredPromptRef.current, isIosSafari())
    }, DELAY_MS)

    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    }
  }, [])

  return null
}
