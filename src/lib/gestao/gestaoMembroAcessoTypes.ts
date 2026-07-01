import type { ContaMembroRole } from '../auth/contaMembroDb'

export type PerfilGestaoMembro = 'coordenador' | 'auditor' | 'faturista'

export const CHAVE_PERFIL_GESTAO = 'gestao_coordenador' as const
export const CHAVE_GESTAO_AUDITOR = 'gestao_auditor' as const
export const CHAVE_GESTAO_FATURISTA = 'gestao_faturista' as const

export function chaveMarcadorPerfil(perfil: PerfilGestaoMembro): string {
  if (perfil === 'coordenador') return CHAVE_PERFIL_GESTAO
  if (perfil === 'auditor') return CHAVE_GESTAO_AUDITOR
  return CHAVE_GESTAO_FATURISTA
}

export const PERMISSOES_COORDENADOR_GESTAO = [
  { key: 'escalas_visualizar', label: 'Visualizar escalas (mensal, semanal e mural)' },
  { key: 'escalas_editar', label: 'Produção de escalas (editar semanal e mensal)' },
  { key: 'relatorios_emitir', label: 'Emitir relatórios' },
  { key: 'relatorios_rascunho', label: 'Gerir rascunhos de relatórios' },
  { key: 'relatorios_historico', label: 'Histórico de relatórios' },
  { key: 'indicadores_sciras', label: 'Indicadores SCIRAS' },
] as const

export const PERMISSOES_AUDITOR_GESTAO = [
  { key: 'workflow_auditoria', label: 'Auditar relatórios em revisão' },
  { key: 'workflow_aprovar', label: 'Aprovar relatórios' },
  { key: 'workflow_documentos', label: 'Visualizar documentos anexos' },
  { key: 'relatorios_historico', label: 'Histórico de relatórios' },
] as const

export const PERMISSOES_FATURISTA_GESTAO = [
  { key: 'financeiro_extratos', label: 'Extratos financeiros' },
  { key: 'financeiro_fechamento', label: 'Fechamento de faturamento' },
  { key: 'workflow_faturar', label: 'Faturar relatórios aprovados' },
  { key: 'relatorios_historico', label: 'Histórico de relatórios' },
] as const

export type ChavePermissaoCoordenadorGestao =
  (typeof PERMISSOES_COORDENADOR_GESTAO)[number]['key']
export type ChavePermissaoAuditorGestao = (typeof PERMISSOES_AUDITOR_GESTAO)[number]['key']
export type ChavePermissaoFaturistaGestao =
  (typeof PERMISSOES_FATURISTA_GESTAO)[number]['key']

export const SENHA_PADRAO_MEMBRO_GESTAO = 'PlantaoCheck@'

export function permissoesPadraoCoordenadorGestao(): Record<string, boolean> {
  const base: Record<string, boolean> = { [CHAVE_PERFIL_GESTAO]: true }
  for (const { key } of PERMISSOES_COORDENADOR_GESTAO) {
    base[key] =
      key === 'escalas_visualizar' ||
      key === 'escalas_editar' ||
      key === 'relatorios_emitir' ||
      key === 'relatorios_rascunho'
  }
  return base
}

export function permissoesPadraoAuditorGestao(): Record<string, boolean> {
  const base: Record<string, boolean> = { [CHAVE_GESTAO_AUDITOR]: true }
  for (const { key } of PERMISSOES_AUDITOR_GESTAO) {
    base[key] =
      key === 'workflow_auditoria' ||
      key === 'workflow_aprovar' ||
      key === 'workflow_documentos' ||
      key === 'relatorios_historico'
  }
  return base
}

export function permissoesPadraoFaturistaGestao(): Record<string, boolean> {
  const base: Record<string, boolean> = { [CHAVE_GESTAO_FATURISTA]: true }
  for (const { key } of PERMISSOES_FATURISTA_GESTAO) {
    base[key] =
      key === 'financeiro_extratos' ||
      key === 'financeiro_fechamento' ||
      key === 'workflow_faturar' ||
      key === 'relatorios_historico'
  }
  return base
}

export function permissoesPadraoPorPerfil(perfil: PerfilGestaoMembro): Record<string, boolean> {
  if (perfil === 'coordenador') return permissoesPadraoCoordenadorGestao()
  if (perfil === 'auditor') return permissoesPadraoAuditorGestao()
  return permissoesPadraoFaturistaGestao()
}

export function definicoesPermissoesPorPerfil(perfil: PerfilGestaoMembro) {
  if (perfil === 'coordenador') return PERMISSOES_COORDENADOR_GESTAO
  if (perfil === 'auditor') return PERMISSOES_AUDITOR_GESTAO
  return PERMISSOES_FATURISTA_GESTAO
}

export function roleContaMembroPorPerfil(perfil: PerfilGestaoMembro): ContaMembroRole {
  if (perfil === 'auditor') return 'auditor'
  if (perfil === 'faturista') return 'faturista'
  return 'profissional'
}

export function tituloPerfilGestao(perfil: PerfilGestaoMembro): string {
  if (perfil === 'coordenador') return 'Coordenador'
  if (perfil === 'auditor') return 'Auditor'
  return 'Faturista / Financeiro'
}

export type MembroGestaoLinha = {
  id: string
  auth_user_id: string
  profissional_id: string | null
  role: ContaMembroRole
  nome: string
  email: string
  permissoes: Record<string, boolean>
  must_change_password: boolean
  created_at: string
}

export type FiltroStatusMembroGestao = 'todos' | 'ativo' | 'pendente'

export function statusMembroGestao(m: Pick<MembroGestaoLinha, 'must_change_password'>): 'ativo' | 'pendente' {
  return m.must_change_password ? 'pendente' : 'ativo'
}
