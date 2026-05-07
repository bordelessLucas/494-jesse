import { Bell, ChevronDown, LogOut, Settings, User } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Search } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useSupabaseUser } from '../hooks/useSupabaseUser'

function getFirstTwoInitialsFromLabel(label: string): string {
  const normalizedLabel = label.trim()
  if (normalizedLabel.length === 0) return 'U'

  const words = normalizedLabel
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean)

  if (words.length >= 2) {
    const first = words[0]?.[0] ?? ''
    const second = words[1]?.[0] ?? ''
    const initials = `${first}${second}`.toUpperCase()
    return initials.length > 0 ? initials : 'U'
  }

  const firstTwo = normalizedLabel.replace(/[^a-zA-ZÀ-ÿ0-9]/g, '').slice(0, 2)
  if (firstTwo.length === 0) return 'U'
  return firstTwo.toUpperCase()
}

export function Topbar() {
  const navigate = useNavigate()
  const dropdownId = useId()
  const menuId = useMemo(() => `user-menu-${dropdownId}`, [dropdownId])
  const buttonId = useMemo(() => `user-menu-button-${dropdownId}`, [dropdownId])
  const { user } = useSupabaseUser()

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const userMenuContainerRef = useRef<HTMLDivElement | null>(null)

  const userDisplayName =
    user?.user_metadata?.full_name ??
    user?.email ??
    'Usuário'

  const userInitials = useMemo(() => {
    const label = user?.user_metadata?.full_name ?? user?.email ?? ''
    return getFirstTwoInitialsFromLabel(label)
  }, [user?.email, user?.user_metadata])

  const userSecondaryLabel = user?.email ? 'Conta' : 'Perfil'

  useEffect(() => {
    if (!isUserMenuOpen) return

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const container = userMenuContainerRef.current
      if (!container) return

      const targetNode = event.target
      if (!(targetNode instanceof Node)) return

      if (!container.contains(targetNode)) {
        setIsUserMenuOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown, { passive: true })
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isUserMenuOpen])

  const closeUserMenu = () => setIsUserMenuOpen(false)

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Erro ao fazer logout', error)
    } finally {
      closeUserMenu()
      navigate('/login', { replace: true })
    }
  }

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white shadow-sm">
      <div className="flex h-14 items-center justify-between px-6">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary-600 text-white">
              <span className="text-sm font-semibold leading-none">P</span>
            </div>
            <p className="hidden text-sm font-semibold text-slate-900 sm:block">
              PlantaoCheck
            </p>
          </div>

          <div className="relative hidden w-full max-w-md sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="Pesquisar…"
              className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
            aria-label="Notificações"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger-500 ring-2 ring-white" />
          </button>

          <div className="relative" ref={userMenuContainerRef}>
            <button
              type="button"
              id={buttonId}
              className="flex items-center gap-3 rounded-xl py-1 pl-1 pr-2 text-left transition-colors hover:bg-gray-50"
              aria-label="Menu do usuário"
              aria-haspopup="menu"
              aria-expanded={isUserMenuOpen}
              aria-controls={menuId}
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
            >
              <div className="grid h-9 w-9 place-items-center rounded-full border-2 border-primary-600 bg-slate-200 text-xs font-semibold text-slate-700">
                {userInitials}
              </div>
              <div className="hidden leading-tight sm:block">
                <p className="text-sm font-medium text-slate-900">
                  {userDisplayName}
                </p>
                <p className="text-xs text-gray-500">{userSecondaryLabel}</p>
              </div>
              <ChevronDown className="hidden h-4 w-4 text-gray-400 sm:block" />
            </button>

            <div
              id={menuId}
              role="menu"
              aria-labelledby={buttonId}
              className={[
                'absolute right-0 top-full mt-2 w-60 origin-top-right rounded-2xl border border-gray-100 bg-white p-2 text-sm shadow-xl shadow-slate-200/60 ring-1 ring-black/5 transition',
                isUserMenuOpen
                  ? 'pointer-events-auto translate-y-0 opacity-100'
                  : 'pointer-events-none -translate-y-1 opacity-0',
              ].join(' ')}
            >
              <Link
                to="/meus-dados"
                role="menuitem"
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-slate-700 outline-none transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:bg-slate-50 focus-visible:text-slate-900"
                onClick={closeUserMenu}
              >
                <User className="h-4 w-4 text-slate-500" />
                <span className="font-medium">Meus dados</span>
              </Link>

              <Link
                to="/configuracao"
                role="menuitem"
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-slate-700 outline-none transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:bg-slate-50 focus-visible:text-slate-900"
                onClick={closeUserMenu}
              >
                <Settings className="h-4 w-4 text-slate-500" />
                <span className="font-medium">Configuração</span>
              </Link>

              <div className="my-2 h-px bg-gray-100" />

              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-danger-700 outline-none transition-colors hover:bg-danger-50 focus-visible:bg-danger-50"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 text-danger-600" />
                <span className="font-medium">Logout</span>
              </button>

              <button
                type="button"
                className="sr-only"
                onClick={() => {
                  closeUserMenu()
                  navigate('/meus-dados')
                }}
              >
                Fechar menu
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

