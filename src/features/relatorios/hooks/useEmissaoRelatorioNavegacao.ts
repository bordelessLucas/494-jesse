import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

/** Reposiciona scroll e cancela operações ao trocar de rota de emissão. */
export function useEmissaoRelatorioNavegacao(routeKey: string) {
  const location = useLocation()
  const previewScrollRef = useRef<HTMLElement | null>(null)
  const montadoRef = useRef(true)

  useEffect(() => {
    montadoRef.current = true
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    previewScrollRef.current?.scrollTo({ top: 0, left: 0, behavior: 'instant' })

    return () => {
      montadoRef.current = false
    }
  }, [routeKey, location.pathname])

  return { previewScrollRef, montadoRef }
}
