import { BrandedLogoOrInitial } from './branding/BrandedLogoOrInitial'
import { cn } from '../lib/cn'
import {
  Banknote,
  CalendarClock,
  ChevronRight,
  FileText,
  LayoutDashboard,
  Palette,
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
      { to: '/painel/carga-horaria', label: 'Carga Horária' },
    ],
  },
  {
    to: '/relatorios',
    label: 'Relatórios',
    icon: FileText,
    subItems: [
      { to: '/relatorios/emissao', label: 'Emissão' },
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

const sidebarSurfaceStyle = {
  backgroundColor: 'var(--pc-brand)',
  color: 'var(--pc-brand-foreground)',
} as const

export function Sidebar() {
  return (
    <aside
      style={sidebarSurfaceStyle}
      className="no-print sticky top-0 z-30 hidden h-screen w-64 border-r border-black/15 shadow-[inset_-1px_0_0_rgb(var(--pc-brand-foreground-rgb)/0.04)] md:flex md:flex-col print:hidden"
    >
      <div className="px-4 pb-3 pt-6">
        <div className="flex items-center gap-3">
          <BrandedLogoOrInitial
            className="h-10 w-10 shrink-0 rounded-xl"
            surface="dark"
            alt=""
          />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-lg font-semibold tracking-tight text-current">
              PlantaoCheck
            </p>
            <p className="truncate text-xs text-current/60">Gestão de Plantões</p>
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
                      'text-current/80 hover:bg-current/10 hover:text-current',
                      isActive &&
                        'rounded-l-none border-l-4 border-current/70 bg-black/25 text-current hover:bg-black/25',
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Icon
                        className={cn(
                          'h-5 w-5 shrink-0',
                          isActive ? 'text-current' : 'text-current/60',
                        )}
                      />
                      <span className="truncate">{label}</span>
                    </div>

                    {subItems?.length ? (
                      <ChevronRight
                        className={cn(
                          'h-4 w-4 shrink-0 transition-colors',
                          isActive ? 'text-current' : 'text-current/40',
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
                  <div
                    style={sidebarSurfaceStyle}
                    className="rounded-md p-2 shadow-xl ring-1 ring-current/10"
                  >
                    <ul className="space-y-1">
                      {subItems.map((subItem) => (
                        <li key={subItem.to}>
                          <NavLink
                            to={subItem.to}
                            className={({ isActive }) =>
                              cn(
                                'block rounded-md px-3 py-2 text-sm transition-colors',
                                'text-current/85 hover:bg-black/15 hover:text-current',
                                isActive && 'bg-black/25 text-current',
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

      <div className="border-t border-current/10 px-3 py-2">
        <NavLink
          to="/configuracao/marca"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              'text-current/80 hover:bg-current/10 hover:text-current',
              isActive &&
                'bg-current/15 text-current ring-1 ring-inset ring-current/25',
            )
          }
        >
          <Palette className="h-5 w-5 shrink-0" aria-hidden />
          <span className="truncate">Marca da plataforma</span>
        </NavLink>
      </div>

      <div className="border-t border-current/10 p-4">
        <p className="text-xs text-current/55">Projeto 494 - PlantaoCheck</p>
      </div>
    </aside>
  )
}

