import {
  ArrowLeftRight,
  Baby,
  Banknote,
  Briefcase,
  Calendar,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  Clock,
  Copy,
  Eye,
  FileBarChart,
  FileOutput,
  FileText,
  FolderCog,
  HeartPulse,
  LayoutDashboard,
  LayoutGrid,
  MapPin,
  Receipt,
  Settings2,
  Shield,
  UserCog,
  Users,
  UserX,
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

export type NavigationSection = {
  id: 'operacao' | 'gestao'
  label: string
  items: NavigationItem[]
}

const operacaoItems: NavigationItem[] = [
  {
    to: '/painel',
    label: 'Painel Principal',
    icon: LayoutDashboard,
    subItems: [{ to: '/painel/resumo', label: 'Resumo', icon: LayoutGrid }],
  },
  {
    to: '/escalas',
    label: 'Gestão de Escalas',
    icon: CalendarClock,
    subItems: [
      { to: '/escalas/mensal', label: 'Mensal', icon: Calendar },
      { to: '/escalas/semanal', label: 'Semanal', icon: CalendarDays },
      { to: '/escalas/mural-trocas', label: 'Mural de Trocas', icon: ArrowLeftRight },
      { to: '/escalas/modelos', label: 'Modelos de Escala', icon: Copy },
    ],
  },
  {
    to: '/cadastros-equipa',
    label: 'Cadastros & Equipa',
    icon: Users,
    subItems: [
      { to: '/usuarios/profissionais', label: 'Profissionais', icon: Users },
      { to: '/usuarios/coordenadores', label: 'Coordenadores', icon: UserCog },
      { to: '/usuarios/documentos', label: 'Documentos', icon: FileText },
      { to: '/configuracao/locais', label: 'Locais & Setores', icon: MapPin },
      { to: '/configuracao/avancadas', label: 'Config. Avançadas', icon: Settings2 },
    ],
  },
  {
    to: '/relatorios-plantao',
    label: 'Relatórios PlantãoCheck',
    icon: FileBarChart,
    subItems: [
      { to: '/painel/relatorios', label: 'Financeiros', icon: Banknote },
      { to: '/relatorios-plantao/faltas', label: 'Faltas / Absenteísmo', icon: UserX },
      { to: '/relatorios-plantao/escalas', label: 'Escalas', icon: CalendarCheck },
      { to: '/relatorios-plantao/profissionais', label: 'Profissionais', icon: Users },
      { to: '/relatorios-plantao/coordenadores', label: 'Coordenadores', icon: UserCog },
      { to: '/painel/carga-horaria', label: 'Carga Horária', icon: Clock },
    ],
  },
]

const gestaoItems: NavigationItem[] = [
  {
    to: '/gestao/emissao',
    label: 'Emissão de Relatórios',
    icon: FileOutput,
    subItems: [
      { to: '/relatorios/emissao', label: 'SCIH', icon: Shield },
      { to: '/gestao/emissao/uti-adulto', label: 'UTI Adulto', icon: HeartPulse },
      { to: '/gestao/emissao/uti-pediatrica', label: 'UTI Pediátrica', icon: Baby },
    ],
  },
  {
    to: '/gestao/frequencia',
    label: 'Modelos de Frequência',
    icon: CalendarRange,
    subItems: [
      { to: '/gestao/frequencia/quinzenal', label: 'Quinzenal', icon: CalendarRange },
      { to: '/gestao/frequencia/mensal', label: 'Mensal', icon: Calendar },
      { to: '/gestao/frequencia/semanal', label: 'Semanal', icon: CalendarDays },
    ],
  },
  {
    to: '/gestao/cadastros',
    label: 'Cadastros (Gestão)',
    icon: FolderCog,
    subItems: [
      { to: '/gestao/cadastros/tipo-servico', label: 'Tipo de Serviço', icon: Briefcase },
      {
        to: '/gestao/cadastros/utilizadores/coordenador',
        label: 'Utilizadores — Coordenador',
        icon: UserCog,
      },
      {
        to: '/gestao/cadastros/utilizadores/auditor',
        label: 'Utilizadores — Auditor',
        icon: Eye,
      },
      {
        to: '/gestao/cadastros/utilizadores/faturista',
        label: 'Utilizadores — Faturista',
        icon: Receipt,
      },
    ],
  },
]

export const navigationSections: NavigationSection[] = [
  { id: 'operacao', label: 'Operação', items: operacaoItems },
  { id: 'gestao', label: 'Relatórios de Gestão', items: gestaoItems },
]

/** Lista plana de todos os itens de menu (compatibilidade). */
export const navigationItems: NavigationItem[] = navigationSections.flatMap(
  (section) => section.items,
)

/** Prefixos de rotas restritas a gestores (não exibidas a membros profissionais). */
export const PREFIXOS_MENU_GESTOR = [
  '/cadastros-equipa',
  '/usuarios',
  '/configuracao',
  '/financeiro',
  '/gestao',
] as const

export function itemMenuRestritoAGestor(to: string): boolean {
  return PREFIXOS_MENU_GESTOR.some(
    (prefixo) => to === prefixo || to.startsWith(`${prefixo}/`),
  )
}
