import type { NavigationItem, NavigationSubItem } from '../../lib/navigationItems'

export function subItensDoMenu(item: NavigationItem): NavigationSubItem[] {
  if (item.subItems?.length) return item.subItems
  return (item.subGroups ?? []).flatMap((grupo) => grupo.items)
}

export function isItemMenuAtivo(
  pathname: string,
  to: string,
  item: Pick<NavigationItem, 'subItems' | 'subGroups'>,
): boolean {
  if (pathname === to || pathname.startsWith(`${to}/`)) return true
  return subItensDoMenu(item as NavigationItem).some(
    (sub) => pathname === sub.to || pathname.startsWith(`${sub.to}/`),
  )
}
