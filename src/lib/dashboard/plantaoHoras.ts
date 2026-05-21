import { formatarHoraDb } from '../escalas/plantoesDb'

/** Duração em horas entre duas horas numa data de plantão (cruza meia-noite se fim <= início). */
export function duracaoHorasPlantao(
  dataPlantaoIso: string,
  horaInicio: string,
  horaFim: string,
): number {
  const chave = dataPlantaoIso.slice(0, 10)
  const [y, mo, d] = chave.split('-').map(Number)
  if (!y || !mo || !d) return 0

  const hi = formatarHoraDb(horaInicio)
  const hf = formatarHoraDb(horaFim)
  const [hIn, mIn] = hi.split(':').map(Number)
  const [hOut, mOut] = hf.split(':').map(Number)

  const inicio = new Date(y, mo - 1, d, hIn, mIn, 0, 0)
  let fim = new Date(y, mo - 1, d, hOut, mOut, 0, 0)
  if (fim.getTime() <= inicio.getTime()) {
    fim = new Date(fim.getTime() + 24 * 60 * 60 * 1000)
  }
  return (fim.getTime() - inicio.getTime()) / (1000 * 60 * 60)
}

const reDigits = /\d+/

/** Extrai meta semanal (h) a partir de `detalhes.contratacao.cargaHorariaSemanal` ou valor por omissão. */
export function metaHorasSemanalContrato(detalhes: unknown, padrao = 40): number {
  const d = detalhes as { contratacao?: { cargaHorariaSemanal?: string } } | null
  const raw = d?.contratacao?.cargaHorariaSemanal ?? ''
  const m = String(raw).match(reDigits)
  const n = m ? parseInt(m[0], 10) : NaN
  return Number.isFinite(n) && n > 0 ? n : padrao
}

/** Meta no mês aproximada (4 semanas). */
export function metaHorasMensalContrato(detalhes: unknown, padrao = 40): number {
  return metaHorasSemanalContrato(detalhes, padrao) * 4
}
