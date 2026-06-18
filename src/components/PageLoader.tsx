import { Loader2 } from 'lucide-react'

export function PageLoader() {
  return (
    <div className="grid min-h-[40vh] place-items-center px-4">
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-700 shadow-sm">
        <Loader2 className="h-5 w-5 animate-spin text-primary-600" aria-hidden />
        Carregando página…
      </div>
    </div>
  )
}
