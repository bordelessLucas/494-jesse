import { CalendarClock, MapPinned, User } from 'lucide-react'
import { useMemo } from 'react'

import { chavePermissaoParaRotaSidebar } from '../components/Profissionais/profissionalAcessoTypes'
import { navigationItems, type NavigationItem } from '../lib/navigationItems'
import { useContaMembro } from './useContaMembro'

export function useVisibleNavigationItems(): {
  itensVisiveis: NavigationItem[]
  isLoading: boolean
  isMembroProfissional: boolean
} {
  const { isLoading, isMembroProfissional, permissoes } = useContaMembro()

  const itensVisiveis = useMemo(() => {
    if (!isMembroProfissional) return navigationItems

    const filtrarSub = (subItems: NavigationItem['subItems']) =>
      (subItems ?? []).filter((sub) => {
        const chave = chavePermissaoParaRotaSidebar(sub.to)
        if (!chave) return false
        return Boolean(permissoes[chave])
      })

    const filtrados: NavigationItem[] = []

    if (permissoes.minha_agenda) {
      filtrados.push({
        to: '/minha-agenda',
        label: 'Minha Agenda',
        icon: CalendarClock,
      })
    }

    if (permissoes.registro_ponto) {
      filtrados.push({
        to: '/ponto',
        label: 'Ponto eletrónico',
        icon: MapPinned,
      })
    }

    for (const item of navigationItems) {
      if (item.to === '/usuarios' || item.to === '/configuracao' || item.to === '/financeiro') {
        continue
      }
      const subItems = filtrarSub(item.subItems)
      if (subItems.length === 0) continue
      filtrados.push({ ...item, subItems })
    }

    filtrados.push({
      to: '/meus-dados',
      label: 'Meus dados',
      icon: User,
    })

    return filtrados
  }, [isMembroProfissional, permissoes])

  return { itensVisiveis, isLoading, isMembroProfissional }
}
