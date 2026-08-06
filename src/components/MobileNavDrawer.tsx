import { ShieldPlus, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

import { useVisibleNavigationItems } from '../hooks/useVisibleNavigationItems'
import { getReadableForeground, PRODUCT_DISPLAY_NAME } from '../lib/brandColors'
import { cn } from '../lib/cn'
import { useThemeBranding } from '../theme/ThemeBrandingProvider'
import { BrandLogo } from './branding/BrandLogo'
import { BrandedLogoOrInitial } from './branding/BrandedLogoOrInitial'
import { SidebarNavMenu, SidebarSectionHeader, sectionNavVariant } from './sidebar/SidebarNavMenu'

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
  const { logoUrl, primaryColor, previewPrimaryColor } = useThemeBranding()
  const { secoesVisiveis, isMembroProfissional } = useVisibleNavigationItems()
  const onFecharRef = useRef(onFechar)
  const hasCustomLogo = Boolean(logoUrl)
  const brandIsLight = getReadableForeground(
    previewPrimaryColor ?? primaryColor,
  ).isLightBrand
  const logoSurface = brandIsLight ? 'light' : 'dark'
  const logoTone = brandIsLight ? 'color' : 'mono'

  useEffect(() => {
    onFecharRef.current = onFechar
  }, [onFechar])

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
        className="absolute inset-0 bg-ug-petrol/55 backdrop-blur-[2px]"
        aria-label="Fechar menu"
        onClick={onFechar}
      />

      <aside
        style={sidebarSurfaceStyle}
        className="absolute inset-y-0 left-0 flex w-[min(100vw-3rem,20rem)] flex-col shadow-ug-lg ring-1 ring-black/10 pb-[env(safe-area-inset-bottom)]"
        role="dialog"
        aria-modal
        aria-label="Menu de navegação"
      >
        <div className="flex items-center justify-between gap-3 border-b border-current/10 px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
          <div className="min-w-0 flex-1">
            {hasCustomLogo ? (
              <div className="flex min-w-0 items-center gap-3">
                <BrandedLogoOrInitial
                  className="h-10 w-10 shrink-0"
                  surface={logoSurface}
                  alt={PRODUCT_DISPLAY_NAME}
                />
                <div className="min-w-0 leading-tight">
                  <p className="truncate text-base font-bold tracking-tight">
                    {PRODUCT_DISPLAY_NAME}
                  </p>
                  <p className="truncate text-xs text-current/60">Gestão de plantões</p>
                </div>
              </div>
            ) : (
              <BrandLogo
                variant="horizontal2l"
                surface={logoSurface}
                tone={logoTone}
                size={32}
                className="max-w-[11rem]"
              />
            )}
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

        <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {secoesVisiveis.map((section, sectionIndex) => (
            <div
              key={section.id}
              className={cn(sectionIndex > 0 && 'mt-4 border-t border-current/20 pt-4')}
            >
              <SidebarSectionHeader
                section={section}
                variant={sectionNavVariant(section.id)}
              />
              <SidebarNavMenu
                section={section}
                pathname={pathname}
                variant={sectionNavVariant(section.id)}
                onNavigate={onFechar}
              />
            </div>
          ))}
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
              <ShieldPlus className="h-5 w-5 shrink-0" aria-hidden />
              <span className="truncate">Marca da plataforma</span>
            </NavLink>
          </div>
        ) : null}
      </aside>
    </div>
  )
}
