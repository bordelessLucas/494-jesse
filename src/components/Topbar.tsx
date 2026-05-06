import { Bell } from 'lucide-react'

export function Topbar() {
  return (
    <header className="sticky top-0 z-20 h-14 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-full w-full items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary-600 text-white">
            <span className="text-sm font-semibold leading-none">494</span>
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-slate-900">Borderless</p>
            <p className="text-xs text-slate-500">Gestão de Plantões</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            aria-label="Notificações"
          >
            <Bell className="h-5 w-5" />
          </button>

          <button
            type="button"
            className="flex items-center gap-3 rounded-lg py-1 pl-1 pr-2 text-left transition-colors hover:bg-slate-100"
            aria-label="Menu do usuário"
          >
            <div className="grid h-8 w-8 place-items-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
              FF
            </div>
            <div className="hidden leading-tight sm:block">
              <p className="text-sm font-medium text-slate-900">Usuário</p>
              <p className="text-xs text-slate-500">Conta</p>
            </div>
          </button>
        </div>
      </div>
    </header>
  )
}

