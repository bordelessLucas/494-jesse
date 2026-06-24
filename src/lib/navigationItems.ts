import {
  Banknote,
  CalendarClock,
  ArrowLeftRight,
  FileText,
  LayoutDashboard,
  MapPin,
  Settings2,
  UserCog,
  Users,
} from 'lucide-react'
import type { ComponentType } from 'react'

export type NavigationSubItem = {
  to: string
  label: string
  icon?: ComponentType<{ className?: string }>
}

export type NavigationItem = {
  /** Prefixo da rota: mantém o item ativo para todas as URLs que começam com `to` ou `to/`. */
  to: string
  label: string
  icon: ComponentType<{ className?: string }>
  subItems?: NavigationSubItem[]
}

export const navigationItems: NavigationItem[] = [
  {
    to: '/painel',
    label: 'Painel de Controle',
    icon: LayoutDashboard,
    subItems: [
      { to: '/painel/resumo', label: 'Resumo' },
      { to: '/painel/carga-horaria', label: 'Carga Horária' },
      { to: '/painel/relatorios', label: 'Relatórios Gerenciais' },
      { to: '/painel/confirmacoes', label: 'Confirmações de Plantões' },
    ],
  },
  {
    to: '/relatorios',
    label: 'Relatórios',
    icon: FileText,
    subItems: [
      { to: '/relatorios/emissao', label: 'Emissão' },
      { to: '/relatorios/historico', label: 'Histórico de Relatórios' },
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
      { to: '/escalas/mural-trocas', label: 'Mural de Trocas', icon: ArrowLeftRight },
    ],
  },
  {
    to: '/usuarios',
    label: 'Usuários',
    icon: Users,
    subItems: [
      { to: '/usuarios/profissionais', label: 'Profissionais', icon: Users },
      { to: '/usuarios/coordenadores', label: 'Coordenadores', icon: UserCog },
      { to: '/usuarios/documentos', label: 'Documentos · NOVO', icon: FileText },
    ],
  },
  {
    to: '/configuracao',
    label: 'Configurações',
    icon: Settings2,
    subItems: [
      { to: '/configuracao/locais', label: 'Locais & Setores', icon: MapPin },
      { to: '/configuracao/avancadas', label: 'Remuneração · Avançadas', icon: Banknote },
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
