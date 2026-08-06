import { BrandLogo } from './branding/BrandLogo'
import { useThemeBranding } from '../theme/ThemeBrandingProvider'
import { BrandedLogoOrInitial } from './branding/BrandedLogoOrInitial'
import { SidebarNavMenu, SidebarSectionHeader, sectionNavVariant } from './sidebar/SidebarNavMenu'
import { cn } from '../lib/cn'
import { getReadableForeground, PRODUCT_DISPLAY_NAME } from '../lib/brandColors'
import { Loader2, ShieldPlus } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'

import { useVisibleNavigationItems } from '../hooks/useVisibleNavigationItems'

const sidebarSurfaceStyle = {
  backgroundColor: 'var(--pc-brand)',
  color: 'var(--pc-brand-foreground)',
} as const

export function Sidebar() {
  const { pathname } = useLocation()
  const { logoUrl, primaryColor, previewPrimaryColor } = useThemeBranding()
  const { secoesVisiveis, isLoading, isMembroProfissional } = useVisibleNavigationItems()

  const totalItens = secoesVisiveis.reduce((acc, s) => acc + s.items.length, 0)
  const hasCustomLogo = Boolean(logoUrl)
  const brandIsLight = getReadableForeground(
    previewPrimaryColor ?? primaryColor,
  ).isLightBrand
  const logoSurface = brandIsLight ? 'light' : 'dark'
  const logoTone = brandIsLight ? 'color' : 'mono'

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
      <div className="px-4 pb-4 pt-6">
        {hasCustomLogo ? (
          <div className="flex items-center gap-3">
            <BrandedLogoOrInitial
              className="h-10 w-10 shrink-0"
              surface={logoSurface}
              alt={PRODUCT_DISPLAY_NAME}
            />
            <div className="min-w-0 leading-tight">
              <p className="truncate text-base font-bold tracking-tight text-current">
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
            size={36}
            className="max-w-full"
          />
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {totalItens === 0 ? (
          <p className="px-3 py-2 text-xs text-current/60">
            Nenhum menu disponível para este perfil.
          </p>
        ) : null}

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
            />
          </div>
        ))}
      </nav>

      {!isMembroProfissional ? (
        <div className="border-t border-current/10 px-3 py-2">
          <NavLink
            to="/configuracao/marca"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-ug',
                'text-current/80 hover:bg-current/10 hover:text-current',
                isActive &&
                  'bg-current/15 text-current ring-1 ring-inset ring-current/25',
              )
            }
          >
            <ShieldPlus className="h-5 w-5 shrink-0" aria-hidden />
            <span className="truncate">Marca da plataforma</span>
          </NavLink>
        </div>
      ) : null}

      <div className="border-t border-current/10 p-4">
        <p className="text-xs text-current/55">{PRODUCT_DISPLAY_NAME}</p>
      </div>
    </aside>
  )
}
