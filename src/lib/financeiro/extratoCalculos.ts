/** Uma linha do extrato após carregar do Supabase (ajuste pode ser editado na UI). */
export type LinhaExtratoFinanceiro = {
  plantaoId: string
  dataPlantao: string
  localNome: string
  setorNome: string
  profissionalNome: string
  valorBruto: number
  ajusteFinanceiro: number
  observacaoAjuste: string
}

export type TotaisExtratoFinanceiro = {
  totalBruto: number
  /** Soma dos descontos como valor positivo (parcelas de ajuste negativas). */
  totalDescontosGlosas: number
  /** Soma dos acréscimos (ajustes positivos), informativo. */
  totalAcrescimos: number
  totalLiquido: number
}

/**
 * Valor final por linha: bruto + ajuste (ajuste negativo reduz).
 */
export function valorFinalLinha(valorBruto: number, ajusteFinanceiro: number): number {
  return Number((valorBruto + ajusteFinanceiro).toFixed(2))
}

export function calcularTotaisExtrato(linhas: LinhaExtratoFinanceiro[]): TotaisExtratoFinanceiro {
  let totalBruto = 0
  let totalDescontosGlosas = 0
  let totalAcrescimos = 0
  let totalLiquido = 0

  for (const L of linhas) {
    const bruto = Number(L.valorBruto) || 0
    const ajuste = Number(L.ajusteFinanceiro) || 0
    const finalV = valorFinalLinha(bruto, ajuste)
    totalBruto += bruto
    totalLiquido += finalV
    if (ajuste < 0) totalDescontosGlosas += -ajuste
    if (ajuste > 0) totalAcrescimos += ajuste
  }

  return {
    totalBruto: arred2(totalBruto),
    totalDescontosGlosas: arred2(totalDescontosGlosas),
    totalAcrescimos: arred2(totalAcrescimos),
    totalLiquido: arred2(totalLiquido),
  }
}

function arred2(n: number): number {
  return Number(n.toFixed(2))
}
