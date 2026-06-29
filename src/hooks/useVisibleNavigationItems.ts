import { CalendarClock, MapPinned, User } from 'lucide-react'
import { useMemo } from 'react'

import { chavePermissaoParaRotaSidebar } from '../components/Profissionais/profissionalAcessoTypes'
import {
  itemMenuRestritoAGestor,
  navigationSections,
  type NavigationItem,
  type NavigationSection,
} from '../lib/navigationItems'
import { useContaMembro } from './useContaMembro'

function filtrarItensPorPermissao(
  items: NavigationItem[],
  permissoes: Record<string, boolean>,
): NavigationItem[] {
  const filtrarSub = (subItems: NavigationItem['subItems']) =>
    (subItems ?? []).filter((sub) => {
      const chave = chavePermissaoParaRotaSidebar(sub.to)
      if (!chave) return false
      return Boolean(permissoes[chave])
    })

  const filtrados: NavigationItem[] = []

  for (const item of items) {
    if (itemMenuRestritoAGestor(item.to)) continue
    const subItems = filtrarSub(item.subItems)
    if (subItems.length === 0) continue
    filtrados.push({ ...item, subItems })
  }

  return filtrados
}

export function useVisibleNavigationItems(): {
  secoesVisiveis: NavigationSection[]
  isLoading: boolean
  isMembroProfissional: boolean
} {
  const { isLoading, isMembroProfissional, permissoes } = useContaMembro()

  const secoesVisiveis = useMemo(() => {
    if (!isMembroProfissional) return navigationSections

    const itensProfissional: NavigationItem[] = []

    if (permissoes.minha_agenda) {
      itensProfissional.push({
        to: '/minha-agenda',
        label: 'Minha Agenda',
        icon: CalendarClock,
      })
    }

    if (permissoes.registro_ponto) {
      itensProfissional.push({
        to: '/ponto',
        label: 'Ponto eletrónico',
        icon: MapPinned,
      })
    }

    const itensOperacao = filtrarItensPorPermissao(
      navigationSections.find((s) => s.id === 'operacao')?.items ?? [],
      permissoes,
    )

    itensProfissional.push(...itensOperacao)

    itensProfissional.push({
      to: '/meus-dados',
      label: 'Meus dados',
      icon: User,
    })

    return [{ id: 'operacao' as const, label: 'Operação', items: itensProfissional }]
  }, [isMembroProfissional, permissoes])

  return { secoesVisiveis, isLoading, isMembroProfissional }
}
