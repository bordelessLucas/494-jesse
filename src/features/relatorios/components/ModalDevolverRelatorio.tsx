import { Loader2, X } from 'lucide-react'
import { useEffect, useState } from 'react'

type ModalDevolverRelatorioProps = {
  aberto: boolean
  aProcessar: boolean
  onFechar: () => void
  onConfirmar: (observacao: string) => void
}

export function ModalDevolverRelatorio({
  aberto,
  aProcessar,
  onFechar,
  onConfirmar,
}: ModalDevolverRelatorioProps) {
  const [observacao, setObservacao] = useState('')

  useEffect(() => {
    if (!aberto) setObservacao('')
  }, [aberto])

  if (!aberto) return null

  function aoConfirmar() {
    const texto = observacao.trim()
    if (!texto) return
    onConfirmar(texto)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px]"
        aria-label="Fechar"
        onClick={() => !aProcessar && onFechar()}
      />
      <div
        role="dialog"
        aria-modal
        aria-labelledby="modal-devolver-titulo"
        className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="modal-devolver-titulo" className="text-lg font-semibold text-slate-900">
              Devolver com observações
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Descreva o motivo da devolução. O relatório voltará ao estado «Rascunho».
            </p>
          </div>
          <button
            type="button"
            onClick={onFechar}
            disabled={aProcessar}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
            aria-label="Fechar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <label className="mt-4 block text-sm font-medium text-slate-700">
          Motivo da devolução
          <textarea
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            rows={4}
            disabled={aProcessar}
            placeholder="Indique o que deve ser corrigido…"
            className="mt-1.5 w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 disabled:bg-slate-50"
          />
        </label>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onFechar}
            disabled={aProcessar}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={aoConfirmar}
            disabled={aProcessar || !observacao.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-danger-600 px-4 py-2 text-sm font-semibold text-white hover:bg-danger-700 disabled:opacity-50"
          >
            {aProcessar ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                A devolver…
              </>
            ) : (
              'Confirmar devolução'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
