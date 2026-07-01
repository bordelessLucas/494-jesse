import {
  ArrowLeftRight,
  Banknote,
  BarChart3,
  Calendar,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  ClipboardList,
  Clock,
  Copy,
  FileBarChart,
  FilePenLine,
  FileText,
  Folder,
  Eye,
  LayoutDashboard,
  LayoutGrid,
  MapPin,
  Settings2,
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

export type NavigationSubGroup = {
  heading?: string
  items: NavigationSubItem[]
}

export type NavigationItem = {
  /** Prefixo da rota: mantém o item ativo para todas as URLs que começam com `to` ou `to/`. */
  to: string
  label: string
  icon: ComponentType<{ className?: string }>
  subItems?: NavigationSubItem[]
  subGroups?: NavigationSubGroup[]
}

export type NavigationSection = {
  id: 'operacao' | 'gestao'
  label: string
  icon?: ComponentType<{ className?: string }>
  items: NavigationItem[]
}

const operacaoItems: NavigationItem[] = [
  {
    to: '/painel',
    label: 'Painel Principal',
    icon: LayoutDashboard,
    subItems: [{ to: '/painel/resumo', label: 'Resumo (Dashboard)', icon: LayoutGrid }],
  },
  {
    to: '/escalas',
    label: 'Gestão de Escalas',
    icon: CalendarClock,
    subItems: [
      { to: '/escalas/mensal', label: 'Visão Mensal', icon: Calendar },
      { to: '/escalas/semanal', label: 'Visão Semanal', icon: CalendarDays },
      { to: '/escalas/mural-trocas', label: 'Mural de Trocas', icon: ArrowLeftRight },
      { to: '/escalas/modelos', label: 'Modelos de Escala', icon: Copy },
    ],
  },
  {
    to: '/cadastros-equipa',
    label: 'Cadastros & Equipe',
    icon: Users,
    subItems: [
      { to: '/usuarios/profissionais', label: 'Profissionais', icon: Users },
      { to: '/usuarios/coordenadores', label: 'Coordenadores', icon: UserCog },
      { to: '/usuarios/especialidades', label: 'Especialidades', icon: ClipboardList },
      { to: '/usuarios/visualizadores', label: 'Visualizadores', icon: Eye },
      { to: '/usuarios/documentos', label: 'Documentos', icon: FileText },
      { to: '/configuracao/locais', label: 'Locais & Setores', icon: MapPin },
      { to: '/configuracao/avancadas', label: 'Configurações Avançadas', icon: Settings2 },
    ],
  },
  {
    to: '/relatorios-plantao',
    label: 'Relatórios PlantãoCheck',
    icon: FileBarChart,
    subItems: [
      { to: '/painel/relatorios', label: 'Relatórios Financeiros', icon: Banknote },
      {
        to: '/relatorios-plantao/faltas',
        label: 'Relatórios de Faltas / Absenteísmo',
        icon: UserX,
      },
      { to: '/relatorios-plantao/escalas', label: 'Relatórios de Escalas', icon: CalendarCheck },
      {
        to: '/relatorios-plantao/profissionais',
        label: 'Relatórios de Profissionais',
        icon: Users,
      },
      {
        to: '/relatorios-plantao/coordenadores',
        label: 'Relatórios de Coordenadores',
        icon: UserCog,
      },
      { to: '/painel/carga-horaria', label: 'Análise de Carga Horária', icon: Clock },
    ],
  },
]

const gestaoItems: NavigationItem[] = [
  {
    to: '/gestao/emissao',
    label: 'Emissão de Relatórios',
    icon: FilePenLine,
    subGroups: [
      {
        heading: 'Tipos de Relatórios:',
        items: [
          { to: '/relatorios/emissao', label: 'Relatório SCIH' },
          { to: '/gestao/emissao/uti-adulto', label: 'Relatório UTI Adulto' },
          { to: '/gestao/emissao/uti-pediatrica', label: 'Relatório UTI Pediátrica' },
        ],
      },
    ],
  },
  {
    to: '/gestao/frequencia',
    label: 'Modelos de Frequência',
    icon: ClipboardList,
    subItems: [
      { to: '/gestao/frequencia/quinzenal', label: 'Frequência Quinzenal' },
      { to: '/gestao/frequencia/mensal', label: 'Frequência Mensal' },
      { to: '/gestao/frequencia/semanal', label: 'Frequência Semanal' },
      { to: '/gestao/frequencia/producao', label: 'Produção de Frequência' },
    ],
  },
  {
    to: '/gestao/cadastros',
    label: 'Cadastros (Gestão)',
    icon: Folder,
    subGroups: [
      {
        heading: 'Tipo de Serviço:',
        items: [
          { to: '/gestao/cadastros/tipo-servico/scih', label: 'SCIH' },
          { to: '/gestao/cadastros/tipo-servico/uti-adulto', label: 'UTI Adulto' },
          { to: '/gestao/cadastros/tipo-servico/uti-pediatrica', label: 'UTI Pediátrica' },
        ],
      },
      {
        heading: 'Cadastro de Usuários:',
        items: [
          { to: '/gestao/cadastros/utilizadores/coordenador', label: 'Coordenador' },
          { to: '/gestao/cadastros/utilizadores/auditor', label: 'Auditor' },
          { to: '/gestao/cadastros/utilizadores/faturista', label: 'Faturista / Financeiro' },
        ],
      },
    ],
  },
]

export const navigationSections: NavigationSection[] = [
  { id: 'operacao', label: 'Operação', items: operacaoItems },
  {
    id: 'gestao',
    label: 'Relatórios de Gestão',
    icon: BarChart3,
    items: gestaoItems,
  },
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
