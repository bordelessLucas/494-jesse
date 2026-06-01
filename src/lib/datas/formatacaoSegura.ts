import { format, isValid, parseISO, type Locale } from 'date-fns'

/** Verifica se o valor representa uma data válida. */
export function dataValida(valor: Date | string | null | undefined): boolean {
  if (valor == null) return false
  if (valor instanceof Date) return isValid(valor)
  const texto = String(valor).trim()
  if (!texto) return false
  const chave = texto.match(/^(\d{4}-\d{2}-\d{2})/)?.[1]
  const candidata = chave
    ? parseISO(`${chave}T12:00:00`)
    : parseISO(texto)
  return isValid(candidata)
}

/** Normaliza para `Date` válida ou devolve `null`. */
export function garantirData(
  valor: Date | string | null | undefined,
): Date | null {
  if (valor == null) return null
  if (valor instanceof Date) return isValid(valor) ? valor : null

  const texto = String(valor).trim()
  if (!texto) return null

  const chave = texto.match(/^(\d{4}-\d{2}-\d{2})/)?.[1]
  const partes = chave?.split('-').map(Number)
  if (partes && partes.length === 3) {
    const [y, mo, d] = partes
    if (y && mo && d) {
      const local = new Date(y, mo - 1, d, 12, 0, 0, 0)
      return isValid(local) ? local : null
    }
  }

  const parsed = parseISO(texto)
  return isValid(parsed) ? parsed : null
}

/** Formata data com fallback seguro (nunca lança exceção). */
export function formatarDataSegura(
  valor: Date | string | null | undefined,
  padrao: string,
  opcoes?: { locale?: Locale; fallback?: string },
): string {
  const d = garantirData(valor)
  if (!d) return opcoes?.fallback ?? '—'
  try {
    return format(d, padrao, opcoes?.locale ? { locale: opcoes.locale } : undefined)
  } catch {
    return opcoes?.fallback ?? '—'
  }
}
