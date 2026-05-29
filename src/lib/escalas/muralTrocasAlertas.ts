const anunciosProprios = new Set<string>()

/** Evita toast de alerta global para quem acabou de anunciar o plantão. */
export function marcarAnuncioProprio(plantaoId: string): void {
  anunciosProprios.add(plantaoId)
  window.setTimeout(() => {
    anunciosProprios.delete(plantaoId)
  }, 8000)
}

export function deveIgnorarAlertaMural(plantaoId: string): boolean {
  if (!anunciosProprios.has(plantaoId)) return false
  anunciosProprios.delete(plantaoId)
  return true
}
