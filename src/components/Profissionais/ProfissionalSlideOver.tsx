import { X } from 'lucide-react'

import { cn } from '../../lib/cn'

export interface ProfissionalSlideOverProps {
  open: boolean
  onClose: () => void
}

const inputClassName =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none ring-primary/20 transition-shadow placeholder:text-slate-400 focus:border-primary focus:ring-2'

const labelClassName = 'mb-1.5 block text-sm font-medium text-slate-700'

export function ProfissionalSlideOver({
  open,
  onClose,
}: ProfissionalSlideOverProps) {
  return (
    <div
      className={cn(
        'fixed inset-0 z-50 transition-[visibility]',
        open ? 'visible' : 'invisible pointer-events-none',
      )}
      aria-hidden={!open}
    >
      <button
        type="button"
        tabIndex={open ? 0 : -1}
        className={cn(
          'absolute inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity',
          open ? 'opacity-100' : 'opacity-0',
        )}
        onClick={onClose}
        aria-label="Fechar painel"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="profissional-slideover-title"
        className={cn(
          'fixed inset-y-0 right-0 flex h-full w-full max-w-md flex-col bg-white shadow-xl transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <h2
            id="profissional-slideover-title"
            className="text-lg font-semibold tracking-tight text-slate-900"
          >
            Novo Profissional
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </header>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(event) => {
            event.preventDefault()
          }}
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor="prof-nome" className={labelClassName}>
                  Nome completo
                </label>
                <input
                  id="prof-nome"
                  name="nomeCompleto"
                  type="text"
                  autoComplete="name"
                  className={inputClassName}
                />
              </div>

              <div>
                <label htmlFor="prof-cpf" className={labelClassName}>
                  CPF
                </label>
                <input
                  id="prof-cpf"
                  name="cpf"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  className={cn(inputClassName, 'tabular-nums')}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="prof-email" className={labelClassName}>
                    Email
                  </label>
                  <input
                    id="prof-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label htmlFor="prof-telefone" className={labelClassName}>
                    Telefone
                  </label>
                  <input
                    id="prof-telefone"
                    name="telefone"
                    type="text"
                    inputMode="tel"
                    autoComplete="tel"
                    className={inputClassName}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="prof-conselho-tipo" className={labelClassName}>
                    Conselho
                  </label>
                  <select
                    id="prof-conselho-tipo"
                    name="conselhoTipo"
                    className={cn(inputClassName, 'cursor-pointer')}
                    defaultValue="CRM"
                  >
                    <option value="CRM">CRM</option>
                    <option value="COREN">COREN</option>
                    <option value="CRO">CRO</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="prof-conselho-numero"
                    className={labelClassName}
                  >
                    Número do Conselho
                  </label>
                  <input
                    id="prof-conselho-numero"
                    name="conselhoNumero"
                    type="text"
                    autoComplete="off"
                    className={inputClassName}
                  />
                </div>
              </div>
            </div>
          </div>

          <footer className="shrink-0 border-t border-slate-200 bg-white px-6 py-4">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Salvar
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  )
}
