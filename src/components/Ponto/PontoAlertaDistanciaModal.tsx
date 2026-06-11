import { MapPinOff, X } from 'lucide-react'
import { useEffect } from 'react'

import { RAIO_CHECKIN_METROS, mensagemBloqueioDistancia } from '../../lib/ponto/registroPontoTypes'

type PontoAlertaDistanciaModalProps = {
  aberto: boolean
  hospital?: string
  onFechar: () => void
}

export function PontoAlertaDistanciaModal({
  aberto,
  hospital,
  onFechar,
}: PontoAlertaDistanciaModalProps) {
  useEffect(() => {
    if (!aberto) return
    function aoTecla(e: KeyboardEvent) {
      if (e.key === 'Escape') onFechar()
    }
    document.addEventListener('keydown', aoTecla)
    return () => document.removeEventListener('keydown', aoTecla)
  }, [aberto, onFechar])

  if (!aberto) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/55 backdrop-blur-[2px]"
        aria-label="Fechar"
        onClick={onFechar}
      />
      <div
        className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200"
        role="alertdialog"
        aria-modal
        aria-labelledby="ponto-alerta-distancia-titulo"
      >
        <button
          type="button"
          onClick={onFechar}
          className="absolute right-3 top-3 rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>

        <div className="flex items-start gap-3 pr-8">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <MapPinOff className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 id="ponto-alerta-distancia-titulo" className="text-lg font-semibold text-slate-900">
              Fora do raio permitido
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {mensagemBloqueioDistancia(RAIO_CHECKIN_METROS)}
            </p>
            {hospital ? (
              <p className="mt-2 text-xs text-slate-500">
                Hospital: <span className="font-medium text-slate-700">{hospital}</span>
              </p>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          onClick={onFechar}
          className="mt-6 flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white active:scale-[0.99]"
        >
          Entendi
        </button>
      </div>
    </div>
  )
}
