import { ChevronDown } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

import { cn } from '../../lib/cn'
import type { NavigationItem, NavigationSection } from '../../lib/navigationItems'
import { isItemMenuAtivo, subItensDoMenu } from './sidebarNavUtils'

export type SidebarNavVariant = 'operacao' | 'gestao'

type SidebarNavMenuProps = {
  section: NavigationSection
  pathname: string
  variant?: SidebarNavVariant
  onNavigate?: () => void
}

function classesSubItem(variant: SidebarNavVariant, isSubItemActive: boolean) {
  return cn(
    'flex items-start gap-2 rounded-lg py-1.5 text-sm transition-colors',
    'px-3 pl-9',
    variant === 'operacao' && 'text-current/85 hover:bg-white/10 hover:text-current',
    variant === 'operacao' &&
      isSubItemActive &&
      'bg-blue-400 font-medium text-white hover:bg-blue-400',
    variant === 'gestao' && 'text-current/85 hover:bg-black/15 hover:text-current',
    variant === 'gestao' && isSubItemActive && 'bg-black/25 text-current',
  )
}

function BulletSubItem({
  variant,
  isSubItemActive,
}: {
  variant: SidebarNavVariant
  isSubItemActive: boolean
}) {
  return (
    <span
      className={cn(
        'mt-0.5 shrink-0',
        variant === 'operacao' && isSubItemActive ? 'text-white' : 'text-current/45',
      )}
      aria-hidden
    >
      •
    </span>
  )
}

function SubItensLista({
  item,
  variant,
  onNavigate,
}: {
  item: NavigationItem
  variant: SidebarNavVariant
  onNavigate?: () => void
}) {
  if (item.subGroups?.length) {
    return (
      <div className="mt-1 space-y-1">
        {item.subGroups.map((grupo) => (
          <div key={grupo.heading ?? grupo.items[0]?.to}>
            {grupo.heading ? (
              <p className="px-3 pb-1 pt-2 text-xs text-current/55">{grupo.heading}</p>
            ) : null}
            <ul className="space-y-0.5">
              {grupo.items.map((subItem) => (
                <li key={subItem.to}>
                  <NavLink
                    to={subItem.to}
                    onClick={onNavigate}
                    className={({ isActive: isSubItemActive }) =>
                      classesSubItem(variant, isSubItemActive)
                    }
                  >
                    {({ isActive: isSubItemActive }) => (
                      <>
                        <BulletSubItem variant={variant} isSubItemActive={isSubItemActive} />
                        <span className="leading-tight">{subItem.label}</span>
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    )
  }

  if (!item.subItems?.length) return null

  return (
    <div className="mt-1">
      <ul className="space-y-0.5">
        {item.subItems.map((subItem) => (
          <li key={subItem.to}>
            <NavLink
              to={subItem.to}
              onClick={onNavigate}
              className={({ isActive: isSubItemActive }) =>
                classesSubItem(variant, isSubItemActive)
              }
            >
              {({ isActive: isSubItemActive }) => (
                <>
                  <BulletSubItem variant={variant} isSubItemActive={isSubItemActive} />
                  <span className="leading-tight">{subItem.label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  )
}

function NavMenuItem({
  item,
  pathname,
  variant,
  onNavigate,
}: {
  item: NavigationItem
  pathname: string
  variant: SidebarNavVariant
  onNavigate?: () => void
}) {
  const { to, label, icon: Icon } = item
  const subItens = subItensDoMenu(item)
  const isActive = isItemMenuAtivo(pathname, to, item)
  const isGestao = variant === 'gestao'
  const temSubmenu = subItens.length > 0
  const [expandido, setExpandido] = useState(isActive)

  useEffect(() => {
    if (isActive) setExpandido(true)
  }, [isActive, pathname])

  const submenuVisivel = temSubmenu && expandido

  const classesPai = cn(
    'flex w-full items-center justify-between gap-3 rounded-lg p-3 text-sm font-medium transition-colors',
    'text-current/80 hover:bg-current/10 hover:text-current',
    variant === 'operacao' &&
      isActive &&
      !temSubmenu &&
      'bg-blue-400 text-white hover:bg-blue-400',
    isActive && isGestao && 'text-current',
  )

  const conteudoPai = (
    <>
      <div className="flex min-w-0 items-center gap-3">
        <Icon
          className={cn('h-5 w-5 shrink-0', isActive ? 'text-current' : 'text-current/60')}
        />
        <span className="truncate">{label}</span>
      </div>

      {temSubmenu ? (
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 transition-transform duration-200',
            isActive ? 'text-current' : 'text-current/40',
            expandido && 'rotate-180',
          )}
        />
      ) : null}
    </>
  )

  return (
    <li>
      {temSubmenu ? (
        <button
          type="button"
          aria-expanded={expandido}
          onClick={() => setExpandido((aberto) => !aberto)}
          className={classesPai}
        >
          {conteudoPai}
        </button>
      ) : (
        <Link to={to} onClick={onNavigate} className={classesPai}>
          {conteudoPai}
        </Link>
      )}

      {temSubmenu ? (
        <div
          className={cn(
            'overflow-hidden transition-all duration-200',
            submenuVisivel
              ? 'pointer-events-auto max-h-[32rem] opacity-100'
              : 'pointer-events-none max-h-0 opacity-0',
          )}
        >
          <SubItensLista item={item} variant={variant} onNavigate={onNavigate} />
        </div>
      ) : null}
    </li>
  )
}

export function SidebarSectionHeader({
  section,
  variant,
}: {
  section: NavigationSection
  variant: SidebarNavVariant
}) {
  const SectionIcon = section.icon

  if (variant === 'gestao' && SectionIcon) {
    return (
      <div className="mb-3 flex items-center gap-2 border-b border-current/15 px-3 pb-3">
        <SectionIcon className="h-4 w-4 shrink-0 text-amber-300" aria-hidden />
        <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
          {section.label}
        </p>
      </div>
    )
  }

  return (
    <p className="mb-2 px-3 text-xs font-bold uppercase tracking-wider text-current/45">
      {section.label}
    </p>
  )
}

export function sectionNavVariant(sectionId: NavigationSection['id']): SidebarNavVariant {
  return sectionId === 'gestao' ? 'gestao' : 'operacao'
}

export function SidebarNavMenu({
  section,
  pathname,
  variant = 'operacao',
  onNavigate,
}: SidebarNavMenuProps) {
  return (
    <ul className="space-y-1">
      {section.items.map((item) => (
        <NavMenuItem
          key={item.to}
          item={item}
          pathname={pathname}
          variant={variant}
          onNavigate={onNavigate}
        />
      ))}
    </ul>
  )
}
