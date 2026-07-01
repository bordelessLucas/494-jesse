import { useEffect, type DependencyList } from 'react'

/** Executa efeito com debounce — evita writes síncronos pesados a cada render. */
export function useDebouncedEffect(
  effect: () => void,
  deps: DependencyList,
  delayMs = 400,
) {
  useEffect(() => {
    const timer = window.setTimeout(effect, delayMs)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounce intencional
  }, deps)
}
