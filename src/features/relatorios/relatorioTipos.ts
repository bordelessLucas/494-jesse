export const RELATORIOS_IMPRESSAO = [
  {
    value: 'freq_uti_ped',
    label: 'Frequência UTI PED',
    descricao: 'Mapa de frequência / plantões — UTI Pediátrica',
  },
  {
    value: 'freq_scih',
    label: 'Frequência SCIH',
    descricao: 'Mapa de frequência — SCIH',
  },
  {
    value: 'rel_scih',
    label: 'Relatório SCIH',
    descricao: 'Consolidado SCIH (indicadores e ocorrências)',
  },
] as const

export type RelatorioImpressaoTipo =
  (typeof RELATORIOS_IMPRESSAO)[number]['value']

export const RELATORIOS_GERAIS = [
  { value: 'afastamentos', label: 'Afastamentos' },
  { value: 'plantoes', label: 'Plantões' },
  { value: 'trocas', label: 'Trocas e passagens' },
  { value: 'candidaturas', label: 'Candidaturas' },
  { value: 'financeiro', label: 'Financeiro / repasses' },
  { value: 'carga_horaria', label: 'Carga horária' },
] as const

export type RelatorioGeralTipo = (typeof RELATORIOS_GERAIS)[number]['value']

export type TipoRelatorio = RelatorioImpressaoTipo | RelatorioGeralTipo

export function isRelatorioImpressao(
  tipo: TipoRelatorio,
): tipo is RelatorioImpressaoTipo {
  return RELATORIOS_IMPRESSAO.some((r) => r.value === tipo)
}

export function labelTipoRelatorio(tipo: TipoRelatorio): string {
  const imp = RELATORIOS_IMPRESSAO.find((r) => r.value === tipo)
  if (imp) return imp.label
  const g = RELATORIOS_GERAIS.find((r) => r.value === tipo)
  return g?.label ?? tipo
}
