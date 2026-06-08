import { RefreshCw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { registerSW } from 'virtual:pwa-register'

export function PwaUpdatePrompt() {
  const [mostrar, setMostrar] = useState(false)
  const [atualizando, setAtualizando] = useState(false)
  const atualizarRef = useRef<(reloadPage?: boolean) => Promise<void>>(() => Promise.resolve())

  useEffect(() => {
    atualizarRef.current = registerSW({
      immediate: true,
      onNeedRefresh() {
        setMostrar(true)
      },
    })
  }, [])

  async function aplicarAtualizacao() {
    setAtualizando(true)
    await atualizarRef.current(true)
  }

  if (!mostrar) return null

  return (
    <div className="no-print fixed inset-x-0 bottom-0 z-[70] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] print:hidden md:left-auto md:right-4 md:max-w-sm md:p-0 md:pb-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-300/40 ring-1 ring-black/5">
        <p className="text-sm font-semibold text-slate-900">Nova versao disponivel</p>
        <p className="mt-1 text-xs text-slate-600">
          Atualize o PlantaoCheck para obter as ultimas melhorias.
        </p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => setMostrar(false)}
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Depois
          </button>
          <button
            type="button"
            disabled={atualizando}
            onClick={() => void aplicarAtualizacao()}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
          >
            <RefreshCw
              className={atualizando ? 'h-4 w-4 animate-spin' : 'h-4 w-4'}
              aria-hidden
            />
            Atualizar
          </button>
        </div>
      </div>
    </div>
  )
}
