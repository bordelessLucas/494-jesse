import {
  useEffect,
  useId,
  useMemo,
  useState,
  type FormEvent,
} from 'react'
import { KeyRound, X } from 'lucide-react'

import { SelecaArvoreSetores } from '../Coordenadores/SelecaArvoreSetores'
import { cn } from '../../lib/cn'
import {
  PERMISSOES_PROFISSIONAL,
  SENHA_PADRAO_PROFISSIONAL,
  permissoesProfissionalPadrao,
} from './profissionalAcessoTypes'
import { PROFISSOES, UFS_BR, type LocalComSetoresArvore } from './ProfissionalDetalhesModal'

export type NovoProfissionalInput = {
  nome: string
  cpf: string
  email: string
  telefone: string
  profissao: string
  siglaConselho: string
  conselhoNumero: string
  registroUf: string
  criarAcesso: boolean
  localId: string
  setoresVinculadosIds: string[]
  permissoes: Record<string, boolean>
}

export interface ProfissionalSlideOverProps {
  open: boolean
  onClose: () => void
  onCreate: (input: NovoProfissionalInput) => Promise<{ error?: string; aviso?: string }>
  locaisOpcoes: { id: string; nome: string }[]
  locaisComSetoresArvore: LocalComSetoresArvore[]
}

const inputClassName =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none ring-primary/20 transition-shadow placeholder:text-slate-400 focus:border-primary focus:ring-2'

const labelClassName = 'mb-1.5 block text-sm font-medium text-slate-700'

function estadoInicial(): NovoProfissionalInput {
  return {
    nome: '',
    cpf: '',
    email: '',
    telefone: '',
    profissao: 'Médico(a)',
    siglaConselho: 'CRM',
    conselhoNumero: '',
    registroUf: 'PA',
    criarAcesso: true,
    localId: '',
    setoresVinculadosIds: [],
    permissoes: permissoesProfissionalPadrao(),
  }
}

export function ProfissionalSlideOver({
  open,
  onClose,
  onCreate,
  locaisOpcoes,
  locaisComSetoresArvore,
}: ProfissionalSlideOverProps) {
  const baseId = useId()
  const [form, setForm] = useState(estadoInicial)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setForm(estadoInicial())
      setErro(null)
      setAviso(null)
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
      local: `${baseId}-local`,
    }),
    [baseId],
  )

  function patch<K extends keyof NovoProfissionalInput>(
    campo: K,
    valor: NovoProfissionalInput[K],
  ) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  function alternarPermissao(chave: string, marcado: boolean) {
    setForm((prev) => ({
      ...prev,
      permissoes: { ...prev.permissoes, [chave]: marcado },
    }))
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro(null)
    setAviso(null)

    if (!form.nome.trim()) {
      setErro('Informe o nome completo.')
      return
    }
    if (!form.conselhoNumero.trim()) {
      setErro('Informe o número do conselho.')
      return
    }
    if (form.criarAcesso) {
      if (!form.email.trim()) {
        setErro('Informe o e-mail para criar o acesso à plataforma.')
        return
      }
      if (!form.localId) {
        setErro('Selecione o local principal do profissional.')
        return
      }
      if (form.setoresVinculadosIds.length === 0) {
        setErro('Selecione pelo menos um setor/grupo de atuação.')
        return
      }
      const algumaPermissao = PERMISSOES_PROFISSIONAL.some(
        ({ key }) => form.permissoes[key],
      )
      if (!algumaPermissao) {
        setErro('Marque pelo menos uma área que o profissional poderá aceder.')
        return
      }
    }

    setSalvando(true)
    const { error, aviso: avisoRetorno } = await onCreate({
      ...form,
      nome: form.nome.trim(),
      conselhoNumero: form.conselhoNumero.trim(),
      email: form.email.trim(),
    })
    setSalvando(false)
    if (error) {
      setErro(error)
      return
    }
    if (avisoRetorno) {
      setAviso(avisoRetorno)
      return
    }
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/55 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Fechar modal"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="profissional-novo-modal-title"
        className="relative z-10 flex max-h-[min(94vh,880px)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10"
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Cadastro
            </p>
            <h2
              id="profissional-novo-modal-title"
              className="text-xl font-semibold tracking-tight text-slate-900"
            >
              Novo Profissional
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </header>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
            {erro ? (
              <p
                className="rounded-lg border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-800"
                role="alert"
              >
                {erro}
              </p>
            ) : null}
            {aviso ? (
              <p
                className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
                role="status"
              >
                {aviso}
              </p>
            ) : null}

            <section className="space-y-4 rounded-xl border border-slate-200 p-4 sm:p-5">
              <h3 className="text-sm font-semibold text-slate-900">Identificação</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor={ids.nome} className={labelClassName}>
                    Nome completo *
                  </label>
                  <input
                    id={ids.nome}
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
                    type="text"
                    inputMode="numeric"
                    value={form.cpf}
                    onChange={(e) => patch('cpf', e.target.value)}
                    className={cn(inputClassName, 'tabular-nums')}
                  />
                </div>
                <div>
                  <label htmlFor={ids.email} className={labelClassName}>
                    E-mail {form.criarAcesso ? '*' : ''}
                  </label>
                  <input
                    id={ids.email}
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
                    type="text"
                    inputMode="tel"
                    value={form.telefone}
                    onChange={(e) => patch('telefone', e.target.value)}
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label htmlFor={ids.conselhoTipo} className={labelClassName}>
                    Conselho
                  </label>
                  <select
                    id={ids.conselhoTipo}
                    value={form.siglaConselho}
                    onChange={(e) => patch('siglaConselho', e.target.value)}
                    className={cn(inputClassName, 'cursor-pointer')}
                  >
                    <option value="CRM">CRM</option>
                    <option value="COREN">COREN</option>
                    <option value="CRO">CRO</option>
                  </select>
                </div>
                <div>
                  <label htmlFor={ids.conselhoNumero} className={labelClassName}>
                    Número do conselho *
                  </label>
                  <input
                    id={ids.conselhoNumero}
                    type="text"
                    value={form.conselhoNumero}
                    onChange={(e) => patch('conselhoNumero', e.target.value)}
                    className={inputClassName}
                  />
                </div>
                <div>
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
            </section>

            <section className="space-y-4 rounded-xl border border-slate-200 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <input
                  id={`${baseId}-criar-acesso`}
                  type="checkbox"
                  checked={form.criarAcesso}
                  onChange={(e) => patch('criarAcesso', e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <label
                    htmlFor={`${baseId}-criar-acesso`}
                    className="flex items-center gap-2 text-sm font-semibold text-slate-900"
                  >
                    <KeyRound className="h-4 w-4 text-primary-600" aria-hidden />
                    Criar acesso à plataforma
                  </label>
                  <p className="mt-1 text-sm text-slate-500">
                    Será criada uma conta com o e-mail acima e senha inicial{' '}
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
                      {SENHA_PADRAO_PROFISSIONAL}
                    </code>
                    . O profissional deverá alterá-la no primeiro acesso e só verá os
                    locais/setores e áreas marcados abaixo.
                  </p>
                </div>
              </div>

              {form.criarAcesso ? (
                <div className="space-y-5 border-t border-slate-100 pt-4">
                  <div>
                    <label htmlFor={ids.local} className={labelClassName}>
                      Local principal *
                    </label>
                    <select
                      id={ids.local}
                      value={form.localId}
                      onChange={(e) => patch('localId', e.target.value)}
                      className={cn(inputClassName, 'cursor-pointer')}
                    >
                      <option value="">Selecione um local</option>
                      {locaisOpcoes.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <p className={labelClassName}>Setores / grupos *</p>
                    <p className="mb-3 text-xs text-slate-500">
                      O profissional só acede a dados destes setores.
                    </p>
                    <SelecaArvoreSetores
                      ids={form.setoresVinculadosIds}
                      onIdsChange={(next) => patch('setoresVinculadosIds', next)}
                      locaisComSetoresArvore={locaisComSetoresArvore}
                    />
                  </div>

                  <div>
                    <p className={labelClassName}>Áreas permitidas *</p>
                    <ul className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-200">
                      {PERMISSOES_PROFISSIONAL.map(({ key, label }) => (
                        <li key={key} className="flex items-start gap-3 px-4 py-3">
                          <input
                            type="checkbox"
                            id={`${baseId}-perm-${key}`}
                            checked={Boolean(form.permissoes[key])}
                            onChange={(e) => alternarPermissao(key, e.target.checked)}
                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                          />
                          <label
                            htmlFor={`${baseId}-perm-${key}`}
                            className="text-sm text-slate-800"
                          >
                            {label}
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
            </section>
          </div>

          <footer className="shrink-0 border-t border-slate-200 bg-slate-50/80 px-5 py-4 sm:px-6">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvando}
                className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-800 disabled:opacity-60"
              >
                {salvando ? 'Salvando…' : 'Salvar profissional'}
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  )
}
