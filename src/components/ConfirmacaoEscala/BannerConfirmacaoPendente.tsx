import { ClipboardList, X } from 'lucide-react'
import { useState } from 'react'

import { CardConfirmacaoPendente } from './CardConfirmacaoPendente'
import { useConfirmacaoEscala } from '../../hooks/useConfirmacaoEscala'
import { cn } from '../../lib/cn'

export function BannerConfirmacaoPendente() {
  const { plantoes, totalPendentes, isLoading } = useConfirmacaoEscala()
  const [drawerAberto, setDrawerAberto] = useState(false)

  if (isLoading || totalPendentes === 0) {
    return null
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setDrawerAberto(true)}
        className={cn(
          'no-print fixed bottom-6 right-6 z-40 flex max-w-sm items-center gap-3 rounded-2xl border border-amber-300',
          'bg-amber-50 px-4 py-3 text-left shadow-lg shadow-amber-200/50 transition hover:bg-amber-100',
          'max-md:left-4 max-md:right-4 max-md:max-w-none',
        )}
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-200 text-lg">
          📋
        </span>
        <span className="min-w-0 flex-1 text-sm font-semibold text-amber-950">
          {totalPendentes} plantão{totalPendentes !== 1 ? 'ões' : ''} aguardando sua
          confirmação
        </span>
      </button>

      {drawerAberto ? (
        <div
          className="no-print fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="drawer-confirmacao-titulo"
        >
          <div className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-amber-600" aria-hidden />
                <h2
                  id="drawer-confirmacao-titulo"
                  className="text-base font-semibold text-slate-900"
                >
                  Confirmação de plantões
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setDrawerAberto(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </header>
            <div className="space-y-3 overflow-y-auto p-4">
              {plantoes.map((p) => (
                <CardConfirmacaoPendente
                  key={p.id}
                  plantao={p}
                  onRemovido={() => {
                    if (plantoes.length <= 1) setDrawerAberto(false)
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
