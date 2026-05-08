import { cn } from '../lib/cn'
import {
  Banknote,
  CalendarClock,
  ChevronRight,
  LayoutDashboard,
  Users,
} from 'lucide-react'
import type { ComponentType } from 'react'
import { NavLink } from 'react-router-dom'

type NavigationItem = {
  to: string
  label: string
  icon: ComponentType<{ className?: string }>
  subItems?: { to: string; label: string }[]
}

const navigationItems: NavigationItem[] = [
  {
    to: '/painel',
    label: 'Painel de Controle',
    icon: LayoutDashboard,
    subItems: [
      { to: '/painel/resumo', label: 'Resumo' },
      { to: '/painel/relatorios', label: 'Relatórios' },
      { to: '/painel/carga-horaria', label: 'Carga Horária' },
    ],
  },
  {
    to: '/escalas',
    label: 'Escalas',
    icon: CalendarClock,
    subItems: [
      { to: '/escalas/mensal', label: 'Mensal' },
      { to: '/escalas/semanal', label: 'Semanal' },
      { to: '/escalas/modelos', label: 'Modelos' },
    ],
  },
  {
    to: '/usuarios',
    label: 'Usuários',
    icon: Users,
    subItems: [
      { to: '/usuarios/profissionais', label: 'Profissionais' },
      { to: '/usuarios/locais', label: 'Locais' },
      { to: '/usuarios/especialidades', label: 'Especialidades' },
    ],
  },
  {
    to: '/financeiro',
    label: 'Financeiro',
    icon: Banknote,
    subItems: [
      { to: '/financeiro/extratos', label: 'Extratos' },
      { to: '/financeiro/repasses', label: 'Repasses' },
    ],
  },
]

export function Sidebar() {
  return (
    <aside className="sticky top-0 z-30 hidden h-screen w-64 border-r border-slate-800 bg-slate-900 md:flex md:flex-col">
      <div className="px-4 pb-3 pt-6">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white">
            <span className="text-sm font-semibold leading-none">P</span>
          </div>
          <div className="leading-tight">
            <p className="text-lg font-semibold tracking-tight text-white">
              PlantaoCheck
            </p>
            <p className="text-xs text-slate-400">Gestão de Plantões</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {navigationItems.map(({ to, label, icon: Icon, subItems }) => (
            <li key={to} className="group relative">
              <NavLink to={to}>
                {({ isActive }) => (
                  <div
                    className={cn(
                      'flex items-center justify-between gap-3 rounded-lg p-3 text-sm font-medium transition-colors',
                      'text-slate-400 hover:bg-slate-800 hover:text-white',
                      isActive &&
                        'rounded-l-none border-l-4 border-blue-400 bg-blue-800 text-white hover:bg-blue-800',
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Icon
                        className={cn(
                          'h-5 w-5 shrink-0',
                          isActive ? 'text-white' : 'text-slate-400',
                        )}
                      />
                      <span className="truncate">{label}</span>
                    </div>

                    {subItems?.length ? (
                      <ChevronRight
                        className={cn(
                          'h-4 w-4 shrink-0 transition-colors',
                          isActive ? 'text-white' : 'text-slate-500',
                        )}
                      />
                    ) : null}
                  </div>
                )}
              </NavLink>

              {subItems?.length ? (
                <div
                  className={cn(
                    // Use `pl-2` instead of `ml-2` to avoid a hover “gap” between
                    // the parent item and the floating submenu panel.
                    'pointer-events-none absolute left-full top-0 z-50 w-56 pl-2',
                    'invisible opacity-0 transition',
                    'group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100',
                  )}
                >
                  <div className="rounded-md bg-slate-800 p-2 shadow-lg ring-1 ring-slate-700/50">
                    <ul className="space-y-1">
                      {subItems.map((subItem) => (
                        <li key={subItem.to}>
                          <NavLink
                            to={subItem.to}
                            className={({ isActive }) =>
                              cn(
                                'block rounded-md px-3 py-2 text-sm transition-colors',
                                'text-slate-400 hover:bg-slate-700 hover:text-white',
                                isActive && 'bg-slate-700 text-white',
                              )
                            }
                          >
                            {subItem.label}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-slate-800 p-4">
        <p className="text-xs text-slate-400">Projeto 494 - PlantaoCheck</p>
      </div>
    </aside>
  )
}

