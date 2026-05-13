/**
 * Modelos para recolha de indicadores clínicos SCIRAS (UTI e Centro Cirúrgico).
 */

/** Valores sugeridos para o campo setor do indicador de UTI. */
export const SETORES_UTI_PREDEFINIDOS = [
  'UTI Adulto',
  'UTI Pediátrica',
  'UTI Neonatal',
] as const

export type SetorUtiPredefinido = (typeof SETORES_UTI_PREDEFINIDOS)[number]

export interface IndicadorUti {
  id: string
  /** Competência no formato `YYYY-MM`. */
  mesCompetencia: string
  setor: string
  totalPacientesDia: number
  usuariosAcompanhadosBuscaAtiva: number
  /** Taxa de busca activa: (acompanhados / pacientes-dia) × 100. */
  taxaBuscaAtiva: number
}

export interface IndicadorCirurgico {
  id: string
  mesCompetencia: string
  totalCirurgias: number
  totalCirurgiasLimpas: number
  numInfeccoesCirurgiasLimpas: number
  /** Taxa de infecção em cirurgias limpas: (infecções / cirurgias limpas) × 100. */
  taxaInfeccao: number
}

/**
 * Taxa de busca activa (%). Devolve 0 se `totalPacientesDia` ≤ 0.
 */
export function calcularTaxaBuscaAtiva(
  totalPacientesDia: number,
  usuariosAcompanhadosBuscaAtiva: number,
): number {
  if (totalPacientesDia <= 0) return 0
  return (usuariosAcompanhadosBuscaAtiva / totalPacientesDia) * 100
}

/**
 * Taxa de infecção em cirurgias limpas (%). Devolve 0 se `totalCirurgiasLimpas` ≤ 0.
 */
export function calcularTaxaInfeccao(
  totalCirurgiasLimpas: number,
  numInfeccoesCirurgiasLimpas: number,
): number {
  if (totalCirurgiasLimpas <= 0) return 0
  return (numInfeccoesCirurgiasLimpas / totalCirurgiasLimpas) * 100
}
