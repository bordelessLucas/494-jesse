import { BrandedLogoOrInitial } from './branding/BrandedLogoOrInitial'
import { cn } from '../lib/cn'
import {
  Award,
  Banknote,
  CalendarClock,
  ChevronRight,
  Eye,
  FileText,
  LayoutDashboard,
  MapPin,
  Palette,
  Settings2,
  ShieldAlert,
  UserCog,
  Users,
} from 'lucide-react'
import type { ComponentType } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'

type NavigationItem = {
  /** Prefixo da rota: mantém o item ativo para todas as URLs que começam com `to` ou `to/`. */
  to: string
  label: string
  icon: ComponentType<{ className?: string }>
  subItems?: {
    to: string
    label: string
    icon?: ComponentType<{ className?: string }>
  }[]
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
      { to: '/relatorios/indicadores-sciras', label: 'Indicadores SCIRAS' },
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
      { to: '/usuarios/profissionais', label: 'Profissionais', icon: Users },
      {
        to: '/usuarios/coordenadores',
        label: 'Coordenadores',
        icon: UserCog,
      },
      { to: '/usuarios/visualizadores', label: 'Visualizadores', icon: Eye },
      {
        to: '/usuarios/documentos',
        label: 'Documentos · NOVO',
        icon: FileText,
      },
      { to: '/usuarios/especialidades', label: 'Especialidades', icon: Award },
    ],
  },
  {
    to: '/configuracao',
    label: 'Configurações',
    icon: Settings2,
    subItems: [
      { to: '/configuracao/locais', label: 'Locais & Setores', icon: MapPin },
      { to: '/configuracao/grupos', label: 'Grupos', icon: Users },
      { to: '/configuracao/tipos-plantao', label: 'Tipos de Plantão', icon: CalendarClock },
      {
        to: '/configuracao/situacoes-plantao',
        label: 'Situações do Plantão',
        icon: ShieldAlert,
      },
      { to: '/configuracao/valores', label: 'Valores', icon: Banknote },
      { to: '/configuracao/auto-ajustes', label: 'Auto-Ajustes', icon: Settings2 },
      {
        to: '/configuracao/tipos-contratacao',
        label: 'Tipos de Contratação',
        icon: FileText,
      },
      { to: '/configuracao/habilidades', label: 'Habilidades', icon: Award },
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
  const { pathname } = useLocation()

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
          {navigationItems.map(({ to, label, icon: Icon, subItems }) => {
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
                    'ml-4 mt-1 overflow-hidden rounded-md border border-current/10 bg-black/10',
                    'max-h-0 opacity-0 transition-all duration-200',
                    'group-hover:max-h-112 group-hover:opacity-100',
                    isActive && 'max-h-112 opacity-100',
                  )}
                >
                  <ul className="space-y-1 p-2">
                    {subItems.map((subItem) => (
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
                          {subItem.icon ? (
                            <subItem.icon className="h-4 w-4 shrink-0 text-current/70" />
                          ) : null}
                          <span className="leading-tight">{subItem.label}</span>
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </li>
          )})}
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

