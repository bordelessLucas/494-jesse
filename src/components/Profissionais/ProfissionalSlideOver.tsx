import {
  useEffect,
  useId,
  useMemo,
  useState,
  type FormEvent,
} from 'react'
import { X } from 'lucide-react'

import { cn } from '../../lib/cn'
import { PROFISSOES, UFS_BR } from './ProfissionalDetalhesModal'

export type NovoProfissionalInput = {
  nome: string
  cpf: string
  email: string
  telefone: string
  profissao: string
  siglaConselho: string
  conselhoNumero: string
  registroUf: string
}

export interface ProfissionalSlideOverProps {
  open: boolean
  onClose: () => void
  onCreate: (input: NovoProfissionalInput) => Promise<{ error?: string }>
}

const inputClassName =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none ring-primary/20 transition-shadow placeholder:text-slate-400 focus:border-primary focus:ring-2'

const labelClassName = 'mb-1.5 block text-sm font-medium text-slate-700'

const estadoInicial: NovoProfissionalInput = {
  nome: '',
  cpf: '',
  email: '',
  telefone: '',
  profissao: 'Médico(a)',
  siglaConselho: 'CRM',
  conselhoNumero: '',
  registroUf: 'PA',
}

export function ProfissionalSlideOver({
  open,
  onClose,
  onCreate,
}: ProfissionalSlideOverProps) {
  const baseId = useId()
  const [form, setForm] = useState(estadoInicial)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setForm(estadoInicial)
      setErro(null)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const ids = useMemo(
    () => ({
      nome: `${baseId}-nome`,
      cpf: `${baseId}-cpf`,
      email: `${baseId}-email`,
      telefone: `${baseId}-telefone`,
      profissao: `${baseId}-profissao`,
      conselhoTipo: `${baseId}-conselho`,
      conselhoNumero: `${baseId}-conselho-num`,
      uf: `${baseId}-uf`,
    }),
    [baseId],
  )

  function patch<K extends keyof NovoProfissionalInput>(
    campo: K,
    valor: NovoProfissionalInput[K],
  ) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro(null)
    if (!form.nome.trim()) {
      setErro('Informe o nome completo.')
      return
    }
    if (!form.conselhoNumero.trim()) {
      setErro('Informe o número do conselho.')
      return
    }
    setSalvando(true)
    const { error } = await onCreate({
      ...form,
      nome: form.nome.trim(),
      conselhoNumero: form.conselhoNumero.trim(),
    })
    setSalvando(false)
    if (error) {
      setErro(error)
      return
    }
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Fechar modal"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="profissional-novo-modal-title"
        className={cn(
          'relative z-10 flex max-h-[min(90vh,760px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10',
        )}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <h2
            id="profissional-novo-modal-title"
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
          onSubmit={handleSubmit}
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            {erro ? (
              <p
                className="mb-4 rounded-lg border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-800"
                role="alert"
              >
                {erro}
              </p>
            ) : null}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor={ids.nome} className={labelClassName}>
                  Nome completo
                </label>
                <input
                  id={ids.nome}
                  name="nomeCompleto"
                  type="text"
                  autoComplete="name"
                  value={form.nome}
                  onChange={(e) => patch('nome', e.target.value)}
                  className={inputClassName}
                />
              </div>

              <div>
                <label htmlFor={ids.profissao} className={labelClassName}>
                  Profissão
                </label>
                <select
                  id={ids.profissao}
                  value={form.profissao}
                  onChange={(e) => patch('profissao', e.target.value)}
                  className={cn(inputClassName, 'cursor-pointer')}
                >
                  {PROFISSOES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor={ids.cpf} className={labelClassName}>
                  CPF
                </label>
                <input
                  id={ids.cpf}
                  name="cpf"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={form.cpf}
                  onChange={(e) => patch('cpf', e.target.value)}
                  className={cn(inputClassName, 'tabular-nums')}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor={ids.email} className={labelClassName}>
                    Email
                  </label>
                  <input
                    id={ids.email}
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => patch('email', e.target.value)}
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label htmlFor={ids.telefone} className={labelClassName}>
                    Telefone
                  </label>
                  <input
                    id={ids.telefone}
                    name="telefone"
                    type="text"
                    inputMode="tel"
                    autoComplete="tel"
                    value={form.telefone}
                    onChange={(e) => patch('telefone', e.target.value)}
                    className={inputClassName}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="sm:col-span-1">
                  <label htmlFor={ids.conselhoTipo} className={labelClassName}>
                    Conselho
                  </label>
                  <select
                    id={ids.conselhoTipo}
                    name="conselhoTipo"
                    value={form.siglaConselho}
                    onChange={(e) => patch('siglaConselho', e.target.value)}
                    className={cn(inputClassName, 'cursor-pointer')}
                  >
                    <option value="CRM">CRM</option>
                    <option value="COREN">COREN</option>
                    <option value="CRO">CRO</option>
                  </select>
                </div>
                <div className="sm:col-span-1">
                  <label htmlFor={ids.conselhoNumero} className={labelClassName}>
                    Número do Conselho
                  </label>
                  <input
                    id={ids.conselhoNumero}
                    name="conselhoNumero"
                    type="text"
                    autoComplete="off"
                    value={form.conselhoNumero}
                    onChange={(e) => patch('conselhoNumero', e.target.value)}
                    className={inputClassName}
                  />
                </div>
                <div className="sm:col-span-1">
                  <label htmlFor={ids.uf} className={labelClassName}>
                    UF registro
                  </label>
                  <select
                    id={ids.uf}
                    value={form.registroUf}
                    onChange={(e) => patch('registroUf', e.target.value)}
                    className={cn(inputClassName, 'cursor-pointer')}
                  >
                    {UFS_BR.map((uf) => (
                      <option key={uf} value={uf}>
                        {uf}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <footer className="shrink-0 border-t border-slate-200 bg-slate-50/80 px-5 py-4 sm:px-6">
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
                disabled={salvando}
                className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  )
}
