import { cn } from '../lib/cn'
import {
  Banknote,
  CalendarClock,
  LayoutDashboard,
  MapPin,
  Stethoscope,
} from 'lucide-react'
import type { ComponentType } from 'react'
import { NavLink } from 'react-router-dom'

type NavigationItem = {
  to: string
  label: string
  icon: ComponentType<{ className?: string }>
}

const navigationItems: NavigationItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/escalas', label: 'Escalas', icon: CalendarClock },
  { to: '/profissionais', label: 'Profissionais', icon: Stethoscope },
  { to: '/locais', label: 'Locais', icon: MapPin },
  { to: '/financeiro', label: 'Financeiro', icon: Banknote },
]

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white md:flex md:flex-col">
      <div className="flex h-14 items-center border-b border-slate-200 px-4">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary-600 text-white">
            <span className="text-sm font-semibold leading-none">494</span>
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-slate-900">Borderless</p>
            <p className="text-xs text-slate-500">Gestão de Plantões</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {navigationItems.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    'text-slate-700 hover:bg-slate-100 hover:text-slate-900',
                    isActive && 'bg-primary-50 text-primary-800 hover:bg-primary-50',
                  )
                }
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-slate-200 p-4">
        <p className="text-xs text-slate-500">Projeto 494 - Borderless</p>
      </div>
    </aside>
  )
}

