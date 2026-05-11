import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Printer, X } from 'lucide-react'

import { RelatorioGerencialImpressaoConteudo } from './RelatorioGerencialImpressaoConteudo'
import type { PlantaoRelatorioLinha } from '../../pages/Dashboard/RelatoriosPage'

type RelatorioGerencialImpressaoModalProps = {
  aberto: boolean
  aoFechar: () => void
  tituloDocumento: string
  periodo: string
  linhas: PlantaoRelatorioLinha[]
}

/**
 * Importante: só elementos com .no-print podem usar display:none na impressão.
 * O bloco #impressao-relatorio-gerencial-root NÃO pode estar dentro de um ancestral .no-print,
 * senão o PDF / impressão sai em branco.
 */
const ESTILO_IMPRESSAO = `
@media print {
  .no-print { display: none !important; }
  /* Evita folha extra em branco com o app React atrás do modal */
  body.relatorio-impressao-aberto #root {
    display: none !important;
  }
  html, body {
    height: auto !important;
    overflow: visible !important;
    background: white !important;
  }
  #impressao-relatorio-gerencial-root {
    position: static !important;
    left: auto !important;
    top: auto !important;
    width: 100% !important;
    max-width: none !important;
    margin: 0 !important;
    padding: 0 !important;
    box-shadow: none !important;
    background: white !important;
  }
}
`

export function RelatorioGerencialImpressaoModal({
  aberto,
  aoFechar,
  tituloDocumento,
  periodo,
  linhas,
}: RelatorioGerencialImpressaoModalProps) {
  useEffect(() => {
    if (!aberto) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.body.classList.add('relatorio-impressao-aberto')
    return () => {
      document.body.style.overflow = prevOverflow
      document.body.classList.remove('relatorio-impressao-aberto')
    }
  }, [aberto])

  useEffect(() => {
    if (!aberto) return

    const handleAfterPrint = () => aoFechar()
    window.addEventListener('afterprint', handleAfterPrint)

    const timeoutId = window.setTimeout(() => {
      window.print()
    }, 120)

    return () => {
      window.clearTimeout(timeoutId)
      window.removeEventListener('afterprint', handleAfterPrint)
    }
  }, [aberto, aoFechar])

  if (!aberto || typeof document === 'undefined') return null

  return createPortal(
    <>
      <style>{ESTILO_IMPRESSAO}</style>
      <div className="fixed inset-0 z-70 flex flex-col print:static print:inset-auto">
        <div
          className="no-print pointer-events-auto absolute inset-0 bg-black/50 backdrop-blur-[2px]"
          aria-hidden
        />

        <div className="relative z-10 flex min-h-0 flex-1 flex-col print:relative print:z-auto">
          <div className="no-print flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-sm font-semibold text-slate-800">
              Visualização para impressão
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
              >
                <Printer className="h-4 w-4 shrink-0" aria-hidden />
                Imprimir / Salvar PDF
              </button>
              <button
                type="button"
                onClick={aoFechar}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
              >
                <X className="h-4 w-4" aria-hidden />
                Fechar
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto bg-slate-100 p-4 sm:p-6 print:bg-white print:p-0 print:overflow-visible">
            <div
              id="impressao-relatorio-gerencial-root"
              className="mx-auto max-w-[210mm] bg-white shadow-lg print:mx-0 print:max-w-none print:shadow-none"
            >
              <RelatorioGerencialImpressaoConteudo
                tituloDocumento={tituloDocumento}
                periodo={periodo}
                linhas={linhas}
              />
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body,
  )
}

