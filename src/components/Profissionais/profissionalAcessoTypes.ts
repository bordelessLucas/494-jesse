/** Áreas do sistema que o titular pode conceder a um profissional. */
export const PERMISSOES_PROFISSIONAL = [
  { key: 'minha_agenda', label: 'Minha agenda' },
  { key: 'registro_ponto', label: 'Ponto eletrónico' },
  { key: 'painel_resumo', label: 'Painel — Resumo' },
  { key: 'painel_carga_horaria', label: 'Painel — Carga horária' },
  {
    key: 'escalas_visualizar',
    label: 'Visualizar escalas (mensal, semanal e mural)',
  },
  { key: 'relatorios_emitir', label: 'Emitir relatórios' },
  { key: 'relatorios_historico', label: 'Histórico de relatórios' },
  { key: 'indicadores_sciras', label: 'Indicadores SCIRAS' },
] as const

export type ChavePermissaoProfissional =
  (typeof PERMISSOES_PROFISSIONAL)[number]['key']

export const SENHA_PADRAO_PROFISSIONAL = 'PlantaoCheck@'

export function permissoesProfissionalPadrao(): Record<string, boolean> {
  const base: Record<string, boolean> = {}
  for (const { key } of PERMISSOES_PROFISSIONAL) {
    base[key] =
      key === 'minha_agenda' || key === 'escalas_visualizar' || key === 'registro_ponto'
  }
  return base
}

/** Rotas sempre permitidas a membros profissionais (perfil / troca de senha). */
export const ROTAS_LIBERADAS_MEMBRO = [
  '/meus-dados',
  '/alterar-senha-obrigatoria',
] as const

export function rotaPermitidaParaMembro(
  pathname: string,
  permissoes: Record<string, boolean>,
): boolean {
  if (ROTAS_LIBERADAS_MEMBRO.some((r) => pathname === r || pathname.startsWith(`${r}/`))) {
    return true
  }

  const regras: { prefixo: string; chave: string }[] = [
    { prefixo: '/minha-agenda', chave: 'minha_agenda' },
    { prefixo: '/ponto', chave: 'registro_ponto' },
    { prefixo: '/painel/resumo', chave: 'painel_resumo' },
    { prefixo: '/painel/carga-horaria', chave: 'painel_carga_horaria' },
    { prefixo: '/escalas/mensal', chave: 'escalas_visualizar' },
    { prefixo: '/escalas/semanal', chave: 'escalas_visualizar' },
    { prefixo: '/escalas/mural-trocas', chave: 'escalas_visualizar' },
    { prefixo: '/relatorios/emissao', chave: 'relatorios_emitir' },
    { prefixo: '/relatorios/historico', chave: 'relatorios_historico' },
    { prefixo: '/relatorios/indicadores-sciras', chave: 'indicadores_sciras' },
  ]

  for (const { prefixo, chave } of regras) {
    if (pathname === prefixo || pathname.startsWith(`${prefixo}/`)) {
      return Boolean(permissoes[chave])
    }
  }

  return false
}

/** Primeira rota acessível após login (membro profissional). */
export function rotaInicialMembro(
  permissoes: Record<string, boolean>,
): string {
  if (permissoes.minha_agenda) return '/minha-agenda'
  if (permissoes.registro_ponto) return '/ponto'
  if (permissoes.painel_resumo) return '/painel/resumo'
  if (permissoes.painel_carga_horaria) return '/painel/carga-horaria'
  if (permissoes.escalas_visualizar) return '/escalas/mensal'
  if (permissoes.relatorios_emitir) return '/relatorios/emissao'
  if (permissoes.relatorios_historico) return '/relatorios/historico'
  if (permissoes.indicadores_sciras) return '/relatorios/indicadores-sciras'
  return '/meus-dados'
}

export function chavePermissaoParaRotaSidebar(to: string): string | null {
  if (to.startsWith('/minha-agenda')) return 'minha_agenda'
  if (to.startsWith('/ponto')) return 'registro_ponto'
  if (to.startsWith('/painel/resumo')) return 'painel_resumo'
  if (to.startsWith('/painel/carga-horaria')) return 'painel_carga_horaria'
  if (
    to.startsWith('/escalas/mensal') ||
    to.startsWith('/escalas/semanal') ||
    to.startsWith('/escalas/mural-trocas')
  ) {
    return 'escalas_visualizar'
  }
  if (to.startsWith('/relatorios/emissao')) return 'relatorios_emitir'
  if (to.startsWith('/relatorios/historico')) return 'relatorios_historico'
  if (to.startsWith('/relatorios/indicadores-sciras')) return 'indicadores_sciras'
  return null
}
