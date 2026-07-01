import type { ContaMembroRole } from '../auth/contaMembroDb'

export const CHAVE_GESTAO_VISUALIZADOR = 'gestao_visualizador' as const

export const PERMISSOES_VISUALIZADOR = [
  { key: 'escalas_visualizar', label: 'Visualizar escalas' },
  { key: 'relatorios_historico', label: 'Histórico de relatórios' },
  { key: 'workflow_documentos', label: 'Visualizar documentos anexos' },
  { key: 'painel_resumo', label: 'Painel — Resumo' },
  { key: 'painel_carga_horaria', label: 'Painel — Carga horária' },
  { key: 'indicadores_sciras', label: 'Indicadores SCIRAS' },
] as const

export type ChavePermissaoVisualizador = (typeof PERMISSOES_VISUALIZADOR)[number]['key']

export const SENHA_PADRAO_VISUALIZADOR = 'PlantaoCheck@'

export function permissoesPadraoVisualizador(): Record<string, boolean> {
  const base: Record<string, boolean> = { [CHAVE_GESTAO_VISUALIZADOR]: true }
  for (const { key } of PERMISSOES_VISUALIZADOR) {
    base[key] = true
  }
  return base
}

export type VisualizadorLinha = {
  id: string
  auth_user_id: string
  role: ContaMembroRole
  nome: string
  email: string
  permissoes: Record<string, boolean>
  must_change_password: boolean
  created_at: string
}

export type FiltroStatusVisualizador = 'todos' | 'ativo' | 'pendente'

export function statusVisualizador(
  v: Pick<VisualizadorLinha, 'must_change_password'>,
): 'ativo' | 'pendente' {
  return v.must_change_password ? 'pendente' : 'ativo'
}

const ROTAS_VISUALIZADOR: { prefixo: string; chave: string }[] = [
  { prefixo: '/escalas', chave: 'escalas_visualizar' },
  { prefixo: '/painel/resumo', chave: 'painel_resumo' },
  { prefixo: '/painel/carga-horaria', chave: 'painel_carga_horaria' },
  { prefixo: '/painel/relatorios', chave: 'painel_resumo' },
  { prefixo: '/relatorios/historico', chave: 'relatorios_historico' },
  { prefixo: '/relatorios/indicadores-sciras', chave: 'indicadores_sciras' },
]

export function rotaPermitidaParaVisualizador(
  pathname: string,
  permissoes: Record<string, boolean>,
): boolean {
  if (pathname === '/meus-dados' || pathname.startsWith('/notificacoes')) return true
  if (pathname === '/alterar-senha-obrigatoria') return true

  for (const { prefixo, chave } of ROTAS_VISUALIZADOR) {
    if (pathname === prefixo || pathname.startsWith(`${prefixo}/`)) {
      return Boolean(permissoes[chave])
    }
  }

  return false
}

export function rotaInicialVisualizador(permissoes: Record<string, boolean>): string {
  if (permissoes.painel_resumo) return '/painel/resumo'
  if (permissoes.escalas_visualizar) return '/escalas'
  if (permissoes.painel_carga_horaria) return '/painel/carga-horaria'
  if (permissoes.relatorios_historico) return '/relatorios/historico'
  if (permissoes.indicadores_sciras) return '/relatorios/indicadores-sciras'
  return '/meus-dados'
}
