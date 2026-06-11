import { BrandedLogoOrInitial } from './branding/BrandedLogoOrInitial'
import { cn } from '../lib/cn'
import { ChevronRight, Loader2, Palette } from 'lucide-react'
import { Link, NavLink, useLocation } from 'react-router-dom'

import { useVisibleNavigationItems } from '../hooks/useVisibleNavigationItems'

const sidebarSurfaceStyle = {
  backgroundColor: 'var(--pc-brand)',
  color: 'var(--pc-brand-foreground)',
} as const

export function Sidebar() {
  const { pathname } = useLocation()
  const { itensVisiveis, isLoading, isMembroProfissional } = useVisibleNavigationItems()

  if (isLoading) {
    return (
      <aside
        style={sidebarSurfaceStyle}
        className="no-print sticky top-0 z-30 hidden h-dvh w-64 items-center justify-center border-r border-black/15 md:flex md:flex-col print:hidden"
      >
        <Loader2 className="h-6 w-6 animate-spin text-current/70" aria-hidden />
      </aside>
    )
  }

  return (
    <aside
      style={sidebarSurfaceStyle}
      className="no-print sticky top-0 z-30 hidden h-dvh w-64 border-r border-black/15 shadow-[inset_-1px_0_0_rgb(var(--pc-brand-foreground-rgb)/0.04)] md:flex md:flex-col print:hidden"
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
            <p className="truncate text-xs text-current/60">Gestao de Plantoes</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {itensVisiveis.length === 0 ? (
          <p className="px-3 py-2 text-xs text-current/60">
            Nenhum menu disponível para este perfil.
          </p>
        ) : null}
        <ul className="space-y-1">
          {itensVisiveis.map(({ to, label, icon: Icon, subItems }) => {
            const isActive = pathname === to || pathname.startsWith(`${to}/`)
            const parentHref = subItems?.[0]?.to ?? to

            return (
              <li key={to} className="group relative">
                <Link
                  to={parentHref}
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
                </Link>

                {subItems?.length ? (
                  <div
                    className={cn(
                      'ml-4 mt-1 overflow-hidden rounded-md border border-current/10 bg-black/10 transition-all duration-200',
                      isActive
                        ? 'pointer-events-auto max-h-112 opacity-100'
                        : 'pointer-events-none max-h-0 opacity-0',
                      'group-hover:pointer-events-auto group-hover:max-h-112 group-hover:opacity-100',
                    )}
                  >
                    <ul className="space-y-1 p-2">
                      {subItems.map((subItem) => {
                        const SubIcon = subItem.icon
                        return (
                          <li key={subItem.to}>
                            <NavLink
                              to={subItem.to}
                              className={({ isActive: isSubItemActive }) =>
                                cn(
                                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                                  'text-current/85 hover:bg-black/15 hover:text-current',
                                  isSubItemActive && 'bg-black/25 text-current',
                                )
                              }
                            >
                              {SubIcon ? (
                                <SubIcon className="h-4 w-4 shrink-0 text-current/70" />
                              ) : null}
                              <span className="leading-tight">{subItem.label}</span>
                            </NavLink>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      </nav>

      {!isMembroProfissional ? (
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
      ) : null}

      <div className="border-t border-current/10 p-4">
        <p className="text-xs text-current/55">Projeto 494 - PlantaoCheck</p>
      </div>
    </aside>
  )
}
