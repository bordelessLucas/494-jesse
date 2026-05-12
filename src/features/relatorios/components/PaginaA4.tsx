import type { ReactNode } from 'react'

import { cn } from '../../../lib/cn'

type PaginaA4Props = {
  children: ReactNode
  className?: string
}

/**
 * Envelope visual e estrutural de uma folha A4.
 *
 * Em tela: força largura/altura A4 (210mm × 297mm) com sombra para simular
 * o papel, permitindo preview fiel antes da impressão.
 *
 * Em impressão: zera margens internas (delegando ao `@page` no CSS global),
 * remove sombra/borda e aplica `print-color-adjust: exact` para preservar
 * bordas pretas das tabelas.
 */
export function PaginaA4({ children, className }: PaginaA4Props) {
  return (
    <article
      className={cn(
        'pagina-a4 mx-auto bg-white font-sans text-black shadow-md ring-1 ring-black/5',
        'w-[210mm] min-h-[297mm] p-[15mm]',
        'print:m-0 print:w-auto print:min-h-0 print:p-0 print:shadow-none print:ring-0',
        className,
      )}
    >
      {children}
    </article>
  )
}
