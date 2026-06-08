import { ChevronRight, Palette, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'

import { useVisibleNavigationItems } from '../hooks/useVisibleNavigationItems'
import { cn } from '../lib/cn'
import { BrandedLogoOrInitial } from './branding/BrandedLogoOrInitial'

type MobileNavDrawerProps = {
  aberto: boolean
  onFechar: () => void
}

const sidebarSurfaceStyle = {
  backgroundColor: 'var(--pc-brand)',
  color: 'var(--pc-brand-foreground)',
} as const

export function MobileNavDrawer({ aberto, onFechar }: MobileNavDrawerProps) {
  const { pathname } = useLocation()
  const { itensVisiveis, isMembroProfissional } = useVisibleNavigationItems()
  const onFecharRef = useRef(onFechar)
  onFecharRef.current = onFechar

  useEffect(() => {
    if (!aberto) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [aberto])

  useEffect(() => {
    if (!aberto) return
    function aoTecla(e: KeyboardEvent) {
      if (e.key === 'Escape') onFechar()
    }
    document.addEventListener('keydown', aoTecla)
    return () => document.removeEventListener('keydown', aoTecla)
  }, [aberto, onFechar])

  useEffect(() => {
    onFecharRef.current()
  }, [pathname])

  if (!aberto) return null

  return (
    <div className="no-print fixed inset-0 z-50 md:hidden print:hidden" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/55 backdrop-blur-[2px]"
        aria-label="Fechar menu"
        onClick={onFechar}
      />

      <aside
        style={sidebarSurfaceStyle}
        className="absolute inset-y-0 left-0 flex w-[min(100vw-3rem,20rem)] flex-col shadow-2xl ring-1 ring-black/10 pb-[env(safe-area-inset-bottom)]"
        role="dialog"
        aria-modal
        aria-label="Menu de navegacao"
      >
        <div className="flex items-center justify-between gap-3 border-b border-current/10 px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
          <div className="flex min-w-0 items-center gap-3">
            <BrandedLogoOrInitial className="h-10 w-10 shrink-0 rounded-xl" surface="dark" alt="" />
            <div className="min-w-0 leading-tight">
              <p className="truncate text-lg font-semibold tracking-tight">PlantaoCheck</p>
              <p className="truncate text-xs text-current/60">Gestao de Plantoes</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onFechar}
            className="rounded-lg p-2 text-current/80 hover:bg-current/10"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-4">
          <ul className="space-y-1">
            {itensVisiveis.map(({ to, label, icon: Icon, subItems }) => {
              const isActive = pathname === to || pathname.startsWith(`${to}/`)
              const parentHref = subItems?.[0]?.to ?? to

              return (
                <li key={to}>
                  <Link
                    to={parentHref}
                    onClick={onFechar}
                    className={cn(
                      'flex items-center justify-between gap-3 rounded-lg p-3 text-sm font-medium transition-colors',
                      'text-current/80 hover:bg-current/10 hover:text-current',
                      isActive &&
                        'rounded-l-none border-l-4 border-current/70 bg-black/25 text-current',
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Icon className="h-5 w-5 shrink-0" aria-hidden />
                      <span className="truncate">{label}</span>
                    </div>
                    {subItems?.length ? (
                      <ChevronRight className="h-4 w-4 shrink-0 text-current/50" aria-hidden />
                    ) : null}
                  </Link>

                  {subItems?.length && isActive ? (
                    <ul className="ml-4 mt-1 space-y-1 rounded-md border border-current/10 bg-black/10 p-2">
                      {subItems.map((subItem) => (
                        <li key={subItem.to}>
                          <NavLink
                            to={subItem.to}
                            onClick={onFechar}
                            className={({ isActive: isSubItemActive }) =>
                              cn(
                                'flex items-center gap-2 rounded-md px-3 py-2.5 text-sm transition-colors',
                                'text-current/85 hover:bg-black/15 hover:text-current',
                                isSubItemActive && 'bg-black/25 text-current',
                              )
                            }
                          >
                            {subItem.icon ? (
                              <subItem.icon className="h-4 w-4 shrink-0 text-current/70" aria-hidden />
                            ) : null}
                            <span className="leading-tight">{subItem.label}</span>
                          </NavLink>
                        </li>
                      ))}
                    </ul>
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
              onClick={onFechar}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  'text-current/80 hover:bg-current/10 hover:text-current',
                  isActive && 'bg-current/15 text-current ring-1 ring-inset ring-current/25',
                )
              }
            >
              <Palette className="h-5 w-5 shrink-0" aria-hidden />
              <span className="truncate">Marca da plataforma</span>
            </NavLink>
          </div>
        ) : null}
      </aside>
    </div>
  )
}
