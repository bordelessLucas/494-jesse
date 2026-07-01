import type { TipoRelatorioGerador } from './relatoriosGerenciaisTypes'

/** Mapeia cada rota de menu para o tipo de relatório correspondente. */
export const TIPO_RELATORIO_POR_ROTA: Record<string, TipoRelatorioGerador> = {
  '/painel/relatorios': 'pagamentos',
  '/relatorios-plantao/faltas': 'faltas',
  '/relatorios-plantao/escalas': 'escala',
  '/relatorios-plantao/profissionais': 'plantoes',
  '/relatorios-plantao/coordenadores': 'trocas_passagens',
}

export function tipoRelatorioDaRota(pathname: string): TipoRelatorioGerador | undefined {
  return TIPO_RELATORIO_POR_ROTA[pathname]
}
