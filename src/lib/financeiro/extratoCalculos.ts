import { isWeekend } from 'date-fns'

import { duracaoHorasPlantao } from '../dashboard/plantaoHoras'
import type {
  AcrescimoRemuneracao,
  PlantaoParaRemuneracao,
  RegrasRemuneracao,
  ResultadoValorBrutoRemuneracao,
  TipoPlantaoRemuneracao,
} from './remuneracaoTypes'

/** Uma linha do extrato após carregar do Supabase (ajuste pode ser editado na UI). */
export type LinhaExtratoFinanceiro = {
  plantaoId: string
  dataPlantao: string
  localNome: string
  setorNome: string
  profissionalNome: string
  /** Valor base cadastrado no plantão (antes das regras). */
  valorBase: number
  valorBruto: number
  ajusteFinanceiro: number
  observacaoAjuste: string
  /** Etiquetas ex.: «Inclui adicional de FDS». */
  etiquetasRemuneracao: string[]
}

export type TotaisExtratoFinanceiro = {
  totalBruto: number
  totalDescontosGlosas: number
  totalAcrescimos: number
  totalLiquido: number
}

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

function chaveData(isoData: string): string {
  return isoData.slice(0, 10)
}

function dataLocalMeioDia(isoData: string): Date {
  const chave = chaveData(isoData)
  const [y, m, d] = chave.split('-').map(Number)
  return new Date(y, m - 1, d, 12, 0, 0, 0)
}

function isFeriadoCadastrado(dataIso: string, feriados: RegrasRemuneracao['feriados']): boolean {
  const chave = chaveData(dataIso)
  return feriados.some((f) => f.data_feriado === chave)
}

function especialidadeCombina(
  especialidadeProf: string | null | undefined,
  termo: string | null | undefined,
): boolean {
  if (!termo?.trim()) return false
  const prof = (especialidadeProf ?? '').toLowerCase()
  const alvo = termo.trim().toLowerCase()
  return prof.includes(alvo)
}

function etiquetaParaAcrescimo(acrescimo: AcrescimoRemuneracao): string {
  return `Inclui adicional de ${acrescimo.nome}`
}

function gatilhoAtivo(
  acrescimo: AcrescimoRemuneracao,
  plantao: PlantaoParaRemuneracao,
  regras: RegrasRemuneracao,
): boolean {
  if (!acrescimo.ativo) return false
  const data = dataLocalMeioDia(plantao.dataPlantao)

  switch (acrescimo.gatilho) {
    case 'fim_de_semana':
      return isWeekend(data)
    case 'feriado':
      return isFeriadoCadastrado(plantao.dataPlantao, regras.feriados)
    case 'especialidade':
      return especialidadeCombina(
        plantao.especialidadeProfissional,
        acrescimo.especialidade_contem,
      )
    default:
      return false
  }
}

function multiplicadorTipo(
  tipoId: string | null,
  tipos: TipoPlantaoRemuneracao[],
): { mult: number; nomeTipo: string | null } {
  if (!tipoId) return { mult: 1, nomeTipo: null }
  const tipo = tipos.find((t) => t.id === tipoId && t.ativo)
  if (!tipo) return { mult: 1, nomeTipo: null }
  const mult = Number(tipo.multiplicador)
  return {
    mult: Number.isFinite(mult) && mult > 0 ? mult : 1,
    nomeTipo: tipo.nome,
  }
}

/**
 * Calcula o valor bruto do plantão aplicando tipo de plantão e acréscimos configurados.
 */
export function calcularValorBrutoComRegras(
  plantao: PlantaoParaRemuneracao,
  regras: RegrasRemuneracao,
): ResultadoValorBrutoRemuneracao {
  const valorBaseCadastro = Number(plantao.valorPlantaoBase) || 0
  const horas = duracaoHorasPlantao(
    plantao.dataPlantao,
    plantao.horaInicio,
    plantao.horaFim,
  )

  const { mult, nomeTipo } = multiplicadorTipo(
    plantao.remuneracaoTipoId,
    regras.tiposPlantao,
  )

  let valor = valorBaseCadastro * mult
  const etiquetas: string[] = []

  if (nomeTipo && mult !== 1) {
    const pct = Math.round((mult - 1) * 100)
    etiquetas.push(
      pct >= 0
        ? `Tipo «${nomeTipo}» (+${pct}%)`
        : `Tipo «${nomeTipo}» (${pct}%)`,
    )
  }

  const acrescimosOrdenados = [...regras.acrescimos]
    .filter((a) => a.ativo)
    .sort((a, b) => a.ordem - b.ordem)

  for (const acrescimo of acrescimosOrdenados) {
    if (!gatilhoAtivo(acrescimo, plantao, regras)) continue

    const valorAntes = valor

    switch (acrescimo.tipo_calculo) {
      case 'percentual': {
        const pct = Number(acrescimo.valor) || 0
        valor += valorBaseCadastro * mult * (pct / 100)
        break
      }
      case 'valor_fixo_hora': {
        valor += (Number(acrescimo.valor) || 0) * horas
        break
      }
      case 'valor_fixo_plantao': {
        valor += Number(acrescimo.valor) || 0
        break
      }
    }

    if (valor !== valorAntes) {
      etiquetas.push(etiquetaParaAcrescimo(acrescimo))
    }
  }

  return {
    valorBruto: arred2(valor),
    valorBase: arred2(valorBaseCadastro),
    etiquetas,
  }
}

/** Regras vazias: valor bruto = valor cadastrado no plantão. */
export const REGRAS_REMUNERACAO_VAZIAS: RegrasRemuneracao = {
  tiposPlantao: [],
  acrescimos: [],
  feriados: [],
}
