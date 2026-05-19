import {
  Check,
  Loader2,
  Mail,
  MapPin,
  Shield,
  Trash2,
  UserRound,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useId, useMemo, useState, type ReactNode } from 'react'

import type { LocalComSetoresArvore } from '../Profissionais/ProfissionalDetalhesModal'
import {
  UFS_BR,
  type LocalOpcaoModal,
} from '../Profissionais/ProfissionalDetalhesModal'

import type { CoordenadorCompleto, FormCoordenador } from './coordenadorTypes'
import { PERMISSOES_COORDENADOR } from './coordenadorTypes'
import { SelecaArvoreSetores } from './SelecaArvoreSetores'
import { supabase } from '../../lib/supabase'
import { cn } from '../../lib/cn'

/** Capitals for city datalist (subset; mirror profissionais). */
const CAPITAL_POR_UF: Record<string, string> = {
  PA: 'Belém',
  AM: 'Manaus',
  RJ: 'Rio de Janeiro',
  MG: 'Belo Horizonte',
  SP: 'São Paulo',
}

const extrasCidadesPorUf: Record<string, string[]> = {
  PA: ['Ananindeua', 'Marituba'],
}

function cidadesSugeridasParaUf(uf: string): string[] {
  const cap = CAPITAL_POR_UF[uf]
  const ex = extrasCidadesPorUf[uf] ?? []
  const u = new Set<string>()
  if (cap) u.add(cap)
  ex.forEach((c) => u.add(c))
  return [...u]
}

type AbaCoord = 'informacoes' | 'permissoes' | 'areas' | 'grupos'

const ABAS: { id: AbaCoord; Icon: typeof UserRound; rotulo: string }[] = [
  { id: 'informacoes', Icon: UserRound, rotulo: 'Informações' },
  { id: 'permissoes', Icon: Shield, rotulo: 'Permissões' },
  { id: 'areas', Icon: MapPin, rotulo: 'Áreas' },
  { id: 'grupos', Icon: Users, rotulo: 'Grupos' },
]

const inputEdit =
  'w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20'

function FormLabel({ htmlFor, children }: { htmlFor?: string; children: ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500"
    >
      {children}
    </label>
  )
}

function criarForm(c: CoordenadorCompleto): FormCoordenador {
  const d = c.detalhes
  const permRecord: Record<string, boolean> = {}
  PERMISSOES_COORDENADOR.forEach(({ key }) => {
    permRecord[key] = Boolean(d.permissoes[key])
  })
  const ufIni = (d.endereco.uf?.trim() || 'PA').slice(0, 2)
  const cidadeIni = d.endereco.cidade?.trim()
  const cidadeOuPadrao = cidadeIni || CAPITAL_POR_UF[ufIni] || ''
  return {
    nomeCompleto: c.nome,
    email: (c.email ?? '').trim(),
    telefone1: (c.telefone ?? '').trim(),
    telefone2: (c.telefone2 ?? '').trim(),
    localId: c.localId ?? '',
    enderecoCep: d.endereco.cep ?? '',
    enderecoRua: d.endereco.logradouro ?? '',
    enderecoNumero: d.endereco.numero ?? '',
    enderecoBairro: d.endereco.bairro ?? '',
    enderecoComplemento: d.endereco.complemento ?? '',
    enderecoUf: ufIni,
    enderecoCidade: cidadeOuPadrao,
    setoresVinculadosIds: [...(c.setorIdsVinculados ?? [])],
    permissoes: permRecord,
    areasNotas: (d.areasNotas ?? '').trim(),
  }
}

export interface CoordenadorModalProps {
  open: boolean
  /** Nova ficha antes do primeiro insert (`coordenadores.id` vazio no rascunho). */
  modo: 'criar' | 'editar'
  coordenador: CoordenadorCompleto | null
  locaisOpcoes: LocalOpcaoModal[]
  locaisComSetoresArvore: LocalComSetoresArvore[]
  onClose: () => void
  /** Baseline atual (lista ou rascunho novo) para `mergeFormCoordenador` no pai. */
  onSave?: (
    baseline: CoordenadorCompleto,
    form: FormCoordenador,
  ) => Promise<{ error?: string }>
  onDelete?: (id: string) => Promise<{ error?: string }>
}

export function CoordenadorModal({
  open,
  modo,
  coordenador,
  locaisOpcoes,
  locaisComSetoresArvore,
  onClose,
  onSave,
  onDelete,
}: CoordenadorModalProps) {
  const [aba, setAba] = useState<AbaCoord>('informacoes')
  const [form, setForm] = useState<FormCoordenador | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [recuperacaoAuth, setRecuperacaoAuth] = useState<{
    tipo: 'ok' | 'erro'
    mensagem: string
  } | null>(null)
  const [recuperandoSenha, setRecuperandoSenha] = useState(false)
  const [novaSenha, setNovaSenha] = useState('')
  const [repetirSenha, setRepetirSenha] = useState('')

  const cidadeListaId = useId()

  useEffect(() => {
    if (open && coordenador) {
      setAba('informacoes')
      setForm(criarForm(coordenador))
      setSaveError(null)
      setRecuperacaoAuth(null)
      setNovaSenha('')
      setRepetirSenha('')
    }
  }, [open, coordenador, modo])

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const cidadesSuggestion = useMemo(
    () => cidadesSugeridasParaUf(form?.enderecoUf ?? 'PA'),
    [form?.enderecoUf],
  )

  if (!open || !coordenador || !form) return null

  const ehCriar = modo === 'criar'

  const c = coordenador

  function patch<K extends keyof FormCoordenador>(campo: K, valor: FormCoordenador[K]) {
    setForm((prev) => (prev ? { ...prev, [campo]: valor } : prev))
  }

  async function aoRecuperarSenha() {
    if (ehCriar) return
    const atual = form
    if (!atual) return
    setSaveError(null)
    setRecuperacaoAuth(null)
    const email = atual.email.trim()
    if (!email) {
      setSaveError('Informe um e-mail em Informações para enviar recuperação.')
      setAba('informacoes')
      return
    }
    const origem =
      (typeof import.meta.env.VITE_PUBLIC_SITE_URL === 'string' &&
        import.meta.env.VITE_PUBLIC_SITE_URL.trim()) ||
      window.location.origin
    setRecuperandoSenha(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origem.replace(/\/$/, '')}/login`,
    })
    setRecuperandoSenha(false)
    if (error) {
      setRecuperacaoAuth({
        tipo: 'erro',
        mensagem: error.message ?? 'Não foi possível enviar o e-mail.',
      })
      return
    }
    setRecuperacaoAuth({
      tipo: 'ok',
      mensagem:
        'Se existir conta com esse e-mail, será enviada a mensagem de redefinição de senha.',
    })
  }

  async function aoSalvar() {
    const atual = form
    if (!atual) return
    setSaveError(null)
    setRecuperacaoAuth(null)

    if (!atual.nomeCompleto.trim()) {
      setSaveError('Informe o nome.')
      setAba('informacoes')
      return
    }
    if (!atual.email.trim()) {
      setSaveError('Informe o e-mail.')
      setAba('informacoes')
      return
    }
    if (!atual.enderecoUf.trim()) {
      setSaveError('Selecione a UF do endereço.')
      setAba('informacoes')
      return
    }
    if (!atual.enderecoCidade.trim()) {
      setSaveError('Informe a cidade do endereço.')
      setAba('informacoes')
      return
    }

    if (!onSave) return

    const senhasPreenchidas = novaSenha.trim().length > 0 || repetirSenha.trim().length > 0
    if (senhasPreenchidas) {
      if (novaSenha.trim() !== repetirSenha.trim()) {
        setSaveError('As senhas não coincidem (ou limpe ambos para salvar só dados).')
        setAba('informacoes')
        return
      }
      setSaveError(
        ehCriar
          ? 'Os campos de senha não são gravados neste formulário — crie o utilizador em Supabase Auth ou use «Recuperar senha» depois que o coordenador tiver conta. Limpe os campos de senha para salvar apenas os dados da ficha.'
          : 'A senha não é gravada aqui nesta sessão — use «Recuperar senha» com o e-mail do coordenador ou gere o utilizador em Auth Dashboard. Limpe os campos de senha para salvar.',
      )
      setAba('informacoes')
      return
    }

    setSalvando(true)
    const res = await onSave(c, atual)
    setSalvando(false)
    if (res.error) {
      setSaveError(res.error)
      return
    }
    onClose()
  }

  async function aoRemover() {
    if (!onDelete || ehCriar || !c.id.trim()) return
    if (
      !window.confirm(
        'Remover este coordenador da sua conta? Os vínculos com setores serão removidos. Esta ação não pode ser desfeita.',
      )
    ) {
      return
    }
    setSalvando(true)
    const { error } = await onDelete(c.id)
    setSalvando(false)
    if (error) setSaveError(error)
    else onClose()
  }

  let body: ReactNode
  switch (aba) {
    case 'informacoes':
      body = (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(260px,0.42fr)]">
          <div className="space-y-6">
            <section className="space-y-4">
              <h3 className="border-b border-slate-200 pb-2 text-sm font-semibold text-slate-800">
                Dados pessoais
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <FormLabel htmlFor="cd-nome">Nome completo *</FormLabel>
                  <input
                    id="cd-nome"
                    value={form.nomeCompleto}
                    onChange={(e) => patch('nomeCompleto', e.target.value)}
                    className={inputEdit}
                  />
                </div>
                <div>
                  <FormLabel htmlFor="cd-email">E-mail *</FormLabel>
                  <input
                    id="cd-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => patch('email', e.target.value)}
                    className={inputEdit}
                  />
                </div>
                <div>
                  <FormLabel htmlFor="cd-t1">Telefone 1</FormLabel>
                  <input
                    id="cd-t1"
                    value={form.telefone1}
                    onChange={(e) => patch('telefone1', e.target.value)}
                    className={inputEdit}
                  />
                </div>
                <div>
                  <FormLabel htmlFor="cd-t2">Telefone 2</FormLabel>
                  <input
                    id="cd-t2"
                    value={form.telefone2}
                    onChange={(e) => patch('telefone2', e.target.value)}
                    className={inputEdit}
                  />
                </div>
                <div className="lg:col-span-4">
                  <FormLabel htmlFor="cd-local-p">Local principal</FormLabel>
                  <select
                    id="cd-local-p"
                    value={form.localId}
                    onChange={(e) => patch('localId', e.target.value)}
                    className={cn(inputEdit, 'cursor-pointer')}
                  >
                    <option value="">Selecione</option>
                    {form.localId && !locaisOpcoes.some((l) => l.id === form.localId) ? (
                      <option value={form.localId}>Local anterior (fora da lista)</option>
                    ) : null}
                    {locaisOpcoes.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="border-b border-slate-200 pb-2 text-sm font-semibold text-slate-800">
                Endereço
              </h3>
              <div className="grid gap-4 sm:grid-cols-12">
                <div className="sm:col-span-3">
                  <FormLabel htmlFor="cd-cep">CEP</FormLabel>
                  <input
                    id="cd-cep"
                    value={form.enderecoCep}
                    onChange={(e) => patch('enderecoCep', e.target.value)}
                    placeholder="00000-000"
                    className={inputEdit}
                  />
                </div>
                <div className="sm:col-span-6">
                  <FormLabel htmlFor="cd-rua">Rua</FormLabel>
                  <input
                    id="cd-rua"
                    value={form.enderecoRua}
                    onChange={(e) => patch('enderecoRua', e.target.value)}
                    className={inputEdit}
                  />
                </div>
                <div className="sm:col-span-3">
                  <FormLabel htmlFor="cd-num">Número</FormLabel>
                  <input
                    id="cd-num"
                    value={form.enderecoNumero}
                    onChange={(e) => patch('enderecoNumero', e.target.value)}
                    className={inputEdit}
                  />
                </div>
                <div className="sm:col-span-6">
                  <FormLabel htmlFor="cd-bai">Bairro</FormLabel>
                  <input
                    id="cd-bai"
                    value={form.enderecoBairro}
                    onChange={(e) => patch('enderecoBairro', e.target.value)}
                    className={inputEdit}
                  />
                </div>
                <div className="sm:col-span-6">
                  <FormLabel htmlFor="cd-comp">Complemento</FormLabel>
                  <input
                    id="cd-comp"
                    value={form.enderecoComplemento}
                    onChange={(e) => patch('enderecoComplemento', e.target.value)}
                    placeholder="Apartamento..."
                    className={inputEdit}
                  />
                </div>
                <div className="sm:col-span-3">
                  <FormLabel htmlFor="cd-uf">UF *</FormLabel>
                  <select
                    id="cd-uf"
                    value={form.enderecoUf}
                    onChange={(e) => patch('enderecoUf', e.target.value)}
                    className={cn(inputEdit, 'cursor-pointer')}
                  >
                    {UFS_BR.map((uf) => (
                      <option key={uf} value={uf}>
                        {uf}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-9">
                  <FormLabel htmlFor="cd-cidade">Cidade *</FormLabel>
                  <input
                    id="cd-cidade"
                    list={cidadeListaId}
                    value={form.enderecoCidade}
                    onChange={(e) => patch('enderecoCidade', e.target.value)}
                    className={inputEdit}
                  />
                  <datalist id={cidadeListaId}>
                    {cidadesSuggestion.map((ci) => (
                      <option key={ci} value={ci} />
                    ))}
                  </datalist>
                </div>
              </div>
            </section>
          </div>

          <div className="h-fit rounded-lg border border-slate-200 bg-slate-100/80 p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Senha</h3>
            {ehCriar ? (
              <p className="mb-3 text-xs text-slate-600">
                Defina primeiro a conta no Auth do Supabase; estes campos são apenas uma
                pré-visualização até termos fluxo automatizado de convite (limpe antes de
                salvar se não usar).
              </p>
            ) : (
              <p className="mb-3 text-xs text-slate-600">
                Preferencialmente utilize <strong>Recuperar senha</strong> com o e-mail do
                coordenador quando ele já tiver utilizador criado no Supabase Auth.
              </p>
            )}
            <div className="space-y-3">
              <div>
                <FormLabel htmlFor="cd-sn">{ehCriar ? 'Senha *' : 'Nova senha'}</FormLabel>
                <input
                  id="cd-sn"
                  type="password"
                  autoComplete="new-password"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  className={inputEdit}
                />
              </div>
              <div>
                <FormLabel htmlFor="cd-sn2">{ehCriar ? 'Repetir senha *' : 'Repetir senha'}</FormLabel>
                <input
                  id="cd-sn2"
                  type="password"
                  autoComplete="new-password"
                  value={repetirSenha}
                  onChange={(e) => setRepetirSenha(e.target.value)}
                  className={inputEdit}
                />
              </div>
              {ehCriar ? (
                <p className="text-xs text-slate-500">
                  Digite a senha e clique em Salvar Alterações.
                </p>
              ) : (
                <p className="text-xs text-slate-500">
                  Deixe em branco para não tentar alterar. O fluxo atual altera apenas a conta
                  com a qual você está ligado para recuperação Auth.
                </p>
              )}
            </div>
          </div>
        </div>
      )
      break
    case 'permissoes':
      body = (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Marque o que este coordenador poderá gerir dentro da conta.
          </p>
          <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
            {PERMISSOES_COORDENADOR.map((p) => (
              <li key={p.key} className="flex items-start gap-3 px-4 py-3">
                <input
                  type="checkbox"
                  id={`perm-${p.key}`}
                  checked={Boolean(form.permissoes[p.key])}
                  onChange={(e) =>
                    setForm((prev) =>
                      prev
                        ? {
                            ...prev,
                            permissoes: {
                              ...prev.permissoes,
                              [p.key]: e.target.checked,
                            },
                          }
                        : prev,
                    )
                  }
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                />
                <label htmlFor={`perm-${p.key}`} className="text-sm leading-snug text-slate-800">
                  {p.label}
                </label>
              </li>
            ))}
          </ul>
        </div>
      )
      break
    case 'areas':
      body = (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Documente âmbitos adicionais (ex.: hospitais, programas ou frentes de trabalho).
            O local principal também pode ser escolhido na aba Informações.
          </p>
          <div>
            <FormLabel htmlFor="cd-areas-notas">Resumo das áreas</FormLabel>
            <textarea
              id="cd-areas-notas"
              rows={8}
              value={form.areasNotas}
              onChange={(e) => patch('areasNotas', e.target.value)}
              className={cn(inputEdit, 'min-h-[180px] resize-y')}
              placeholder="Ex.: Plantão Pediatrico Roberto Macedo • Programa X..."
            />
          </div>
        </div>
      )
      break
    case 'grupos':
      body = (
        <SelecaArvoreSetores
          ids={form.setoresVinculadosIds}
          onIdsChange={(next) =>
            setForm((prev) => (prev ? { ...prev, setoresVinculadosIds: next } : prev))
          }
          locaisComSetoresArvore={locaisComSetoresArvore}
        />
      )
      break
    default:
      body = null
  }

  const botaoSalvar = (
    <button
      type="button"
      onClick={() => void aoSalvar()}
      disabled={salvando}
      className="inline-flex items-center gap-2 rounded-md bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[#1d4ed8] disabled:opacity-70"
    >
      {salvando ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" /> Aguarde…
        </>
      ) : (
        <>
          <Check className="h-4 w-4" /> Salvar Alterações
        </>
      )}
    </button>
  )

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
        aria-label="Fechar"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="coordenador-dialog-titulo"
        className="relative z-10 flex max-h-[min(92vh,900px)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10"
      >
        {ehCriar ? (
          <>
            <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
              <h2
                id="coordenador-dialog-titulo"
                className="min-w-0 text-lg font-semibold text-[#2563eb]"
              >
                Adicionar Coordenador
              </h2>
              <div className="ml-auto flex shrink-0 items-center gap-2">
                {botaoSalvar}
                <button
                  type="button"
                  className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
                  onClick={onClose}
                  aria-label="Fechar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </header>
            {saveError ? (
              <div className="border-b border-slate-200 bg-white px-4 py-2 sm:px-5">
                <p className="w-full rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{saveError}</p>
              </div>
            ) : null}
          </>
        ) : (
          <>
            <header className="flex shrink-0 items-start justify-between border-b border-slate-200 px-4 py-3 sm:px-5">
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Alterar coordenador
                </p>
                <h2 id="coordenador-dialog-titulo" className="truncate text-lg font-semibold text-[#2563eb]">
                  {c.nome}
                </h2>
              </div>
              <button type="button" className="rounded-md p-2 text-slate-500 hover:bg-slate-100" onClick={onClose} aria-label="Fechar">
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2 sm:gap-3 sm:px-5">
              {saveError ? (
                <p className="w-full rounded border border-red-200 bg-red-50 px-2 py-1.5 text-sm text-red-800 sm:flex-1">{saveError}</p>
              ) : null}
              {recuperacaoAuth ? (
                <p
                  className={
                    recuperacaoAuth.tipo === 'ok'
                      ? 'w-full rounded border border-green-200 bg-green-50 px-2 py-1.5 text-sm text-green-900 sm:flex-1'
                      : 'w-full rounded border border-red-200 bg-red-50 px-2 py-1.5 text-sm text-red-800 sm:flex-1'
                  }
                >
                  {recuperacaoAuth.mensagem}
                </p>
              ) : null}
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void aoRecuperarSenha()}
                  disabled={salvando || recuperandoSenha}
                  className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
                >
                  {recuperandoSenha ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  Recuperar Senha
                </button>
                <button
                  type="button"
                  onClick={() => void aoRemover()}
                  disabled={salvando || !onDelete}
                  className="inline-flex items-center gap-2 rounded-md border border-red-300 bg-white px-3 py-2 text-sm text-red-700 shadow-sm hover:bg-red-50 disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" aria-hidden /> Remover Coordenador
                </button>
                {botaoSalvar}
              </div>
            </div>
          </>
        )}

        <div className="flex min-h-[400px] flex-1 overflow-hidden md:min-h-0">
          <nav className="w-52 shrink-0 border-b border-slate-200 bg-white p-2 md:border-b-0 md:border-r">
            <ul className="space-y-0.5">
              {ABAS.map(({ id, Icon, rotulo }) => (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => setAba(id)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors',
                      aba === id
                        ? 'bg-blue-50 text-[#2563eb]'
                        : 'text-slate-600 hover:bg-slate-50',
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" /> {rotulo}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-5">
            <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">{body}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
