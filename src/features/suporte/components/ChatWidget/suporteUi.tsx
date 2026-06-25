import { useEffect, type ReactNode } from 'react'

export function TextoSuporteFormatado({ texto }: { texto: string }) {
  const partes = texto.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return (
    <>
      {partes.map((parte, idx) => {
        if (parte.startsWith('**') && parte.endsWith('**') && parte.length >= 4) {
          return <strong key={`s-${idx}`}>{parte.slice(2, -2)}</strong>
        }
        if (parte.startsWith('*') && parte.endsWith('*') && parte.length >= 2) {
          return <em key={`e-${idx}`}>{parte.slice(1, -1)}</em>
        }
        return <span key={`t-${idx}`}>{parte}</span>
      })}
    </>
  )
}

export function useFocusTrap(
  ativo: boolean,
  containerRef: React.RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!ativo || !containerRef.current) return

    const container = containerRef.current
    const focusable = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    const primeiro = focusable[0]
    const ultimo = focusable[focusable.length - 1]
    primeiro?.focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || focusable.length === 0) return
      if (e.shiftKey) {
        if (document.activeElement === primeiro) {
          e.preventDefault()
          ultimo?.focus()
        }
      } else if (document.activeElement === ultimo) {
        e.preventDefault()
        primeiro?.focus()
      }
    }

    container.addEventListener('keydown', onKeyDown)
    return () => container.removeEventListener('keydown', onKeyDown)
  }, [ativo, containerRef])
}

export function BlocoMensagemSuporte({
  de,
  texto,
  children,
}: {
  de: 'usuario' | 'outro'
  texto: string
  children?: ReactNode
}) {
  return (
    <div className="space-y-2">
      <div className={`flex w-full ${de === 'usuario' ? 'justify-end' : 'justify-start'}`}>
        <div
          className={
            de === 'usuario'
              ? 'max-w-[90%] rounded-2xl rounded-br-md bg-primary-600 px-3 py-2 text-sm leading-relaxed text-white shadow-sm'
              : 'max-w-[90%] rounded-2xl rounded-bl-md border border-slate-100 bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-800 shadow-sm'
          }
        >
          <p>
            <TextoSuporteFormatado texto={texto} />
          </p>
        </div>
      </div>
      {children}
    </div>
  )
}
