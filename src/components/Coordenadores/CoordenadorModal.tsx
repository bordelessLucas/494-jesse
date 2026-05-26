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
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100'

function FormLabel({ htmlFor, children }: { htmlFor?: string; children: ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-sm font-medium text-slate-700"
    >
      {children}
    </label>
  )
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 border-b border-slate-100 pb-4">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        {description ? (
          <p className="mt-1 text-sm leading-relaxed text-slate-500">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
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
        <div className="space-y-6">
          <SectionCard title="Dados pessoais">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FormLabel htmlFor="cd-nome">Nome completo *</FormLabel>
                <input
                  id="cd-nome"
                  value={form.nomeCompleto}
                  onChange={(e) => patch('nomeCompleto', e.target.value)}
                  className={inputEdit}
                  placeholder="Nome do coordenador"
                />
              </div>
              <div className="sm:col-span-2">
                <FormLabel htmlFor="cd-email">E-mail *</FormLabel>
                <input
                  id="cd-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => patch('email', e.target.value)}
                  className={inputEdit}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div>
                <FormLabel htmlFor="cd-t1">Telefone 1</FormLabel>
                <input
                  id="cd-t1"
                  value={form.telefone1}
                  onChange={(e) => patch('telefone1', e.target.value)}
                  className={inputEdit}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div>
                <FormLabel htmlFor="cd-t2">Telefone 2</FormLabel>
                <input
                  id="cd-t2"
                  value={form.telefone2}
                  onChange={(e) => patch('telefone2', e.target.value)}
                  className={inputEdit}
                  placeholder="Opcional"
                />
              </div>
              <div className="sm:col-span-2">
                <FormLabel htmlFor="cd-local-p">Local principal</FormLabel>
                <select
                  id="cd-local-p"
                  value={form.localId}
                  onChange={(e) => patch('localId', e.target.value)}
                  className={cn(inputEdit, 'cursor-pointer')}
                >
                  <option value="">Selecione um local</option>
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
          </SectionCard>

          <SectionCard title="Endereço">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-12">
              <div className="lg:col-span-3">
                <FormLabel htmlFor="cd-cep">CEP</FormLabel>
                <input
                  id="cd-cep"
                  value={form.enderecoCep}
                  onChange={(e) => patch('enderecoCep', e.target.value)}
                  placeholder="00000-000"
                  className={inputEdit}
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-6">
                <FormLabel htmlFor="cd-rua">Rua</FormLabel>
                <input
                  id="cd-rua"
                  value={form.enderecoRua}
                  onChange={(e) => patch('enderecoRua', e.target.value)}
                  className={inputEdit}
                />
              </div>
              <div className="lg:col-span-3">
                <FormLabel htmlFor="cd-num">Número</FormLabel>
                <input
                  id="cd-num"
                  value={form.enderecoNumero}
                  onChange={(e) => patch('enderecoNumero', e.target.value)}
                  className={inputEdit}
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-6">
                <FormLabel htmlFor="cd-bai">Bairro</FormLabel>
                <input
                  id="cd-bai"
                  value={form.enderecoBairro}
                  onChange={(e) => patch('enderecoBairro', e.target.value)}
                  className={inputEdit}
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-6">
                <FormLabel htmlFor="cd-comp">Complemento</FormLabel>
                <input
                  id="cd-comp"
                  value={form.enderecoComplemento}
                  onChange={(e) => patch('enderecoComplemento', e.target.value)}
                  placeholder="Apartamento, bloco, referência…"
                  className={inputEdit}
                />
              </div>
              <div className="lg:col-span-3">
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
              <div className="sm:col-span-2 lg:col-span-9">
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
          </SectionCard>

          <SectionCard
            title="Senha"
            description={
              ehCriar
                ? 'Defina primeiro a conta no Auth do Supabase. Estes campos são apenas uma pré-visualização até termos fluxo automatizado de convite — limpe antes de salvar se não usar.'
                : 'Preferencialmente utilize «Recuperar senha» com o e-mail do coordenador quando ele já tiver utilizador criado no Supabase Auth.'
            }
          >
            <div className="grid max-w-2xl gap-5 sm:grid-cols-2">
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
                <FormLabel htmlFor="cd-sn2">
                  {ehCriar ? 'Repetir senha *' : 'Repetir senha'}
                </FormLabel>
                <input
                  id="cd-sn2"
                  type="password"
                  autoComplete="new-password"
                  value={repetirSenha}
                  onChange={(e) => setRepetirSenha(e.target.value)}
                  className={inputEdit}
                />
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-500">
              {ehCriar
                ? 'Digite a senha e clique em Salvar Alterações.'
                : 'Deixe em branco para não tentar alterar. O fluxo atual altera apenas a conta com a qual você está ligado para recuperação Auth.'}
            </p>
          </SectionCard>
        </div>
      )
      break
    case 'permissoes':
      body = (
        <SectionCard
          title="Permissões"
          description="Marque o que este coordenador poderá gerir dentro da conta."
        >
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200">
            {PERMISSOES_COORDENADOR.map((p) => (
              <li key={p.key} className="flex items-start gap-3 bg-white px-4 py-3.5">
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
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor={`perm-${p.key}`} className="text-sm leading-relaxed text-slate-800">
                  {p.label}
                </label>
              </li>
            ))}
          </ul>
        </SectionCard>
      )
      break
    case 'areas':
      body = (
        <SectionCard
          title="Áreas de atuação"
          description="Documente âmbitos adicionais (ex.: hospitais, programas ou frentes de trabalho). O local principal também pode ser escolhido na aba Informações."
        >
          <FormLabel htmlFor="cd-areas-notas">Resumo das áreas</FormLabel>
          <textarea
            id="cd-areas-notas"
            rows={10}
            value={form.areasNotas}
            onChange={(e) => patch('areasNotas', e.target.value)}
            className={cn(inputEdit, 'min-h-[220px] resize-y')}
            placeholder="Ex.: Plantão Pediátrico Roberto Macedo • Programa X..."
          />
        </SectionCard>
      )
      break
    case 'grupos':
      body = (
        <SectionCard
          title="Grupos e setores"
          description="Selecione os setores em que este coordenador atua."
        >
          <SelecaArvoreSetores
            ids={form.setoresVinculadosIds}
            onIdsChange={(next) =>
              setForm((prev) => (prev ? { ...prev, setoresVinculadosIds: next } : prev))
            }
            locaisComSetoresArvore={locaisComSetoresArvore}
          />
        </SectionCard>
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
      className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 disabled:opacity-70"
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/55 backdrop-blur-[2px]"
        aria-label="Fechar"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="coordenador-dialog-titulo"
        className="relative z-10 flex max-h-[min(94vh,920px)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10"
      >
        {ehCriar ? (
          <>
            <header className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Novo cadastro
                </p>
                <h2
                  id="coordenador-dialog-titulo"
                  className="text-xl font-semibold text-slate-900"
                >
                  Adicionar Coordenador
                </h2>
              </div>
              <div className="ml-auto flex shrink-0 items-center gap-2">
                {botaoSalvar}
                <button
                  type="button"
                  className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100"
                  onClick={onClose}
                  aria-label="Fechar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </header>
            {saveError ? (
              <div className="border-b border-slate-200 bg-red-50 px-5 py-3 sm:px-6">
                <p className="text-sm text-red-800">{saveError}</p>
              </div>
            ) : null}
          </>
        ) : (
          <>
            <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Alterar coordenador
                </p>
                <h2 id="coordenador-dialog-titulo" className="truncate text-xl font-semibold text-slate-900">
                  {c.nome}
                </h2>
              </div>
              <button type="button" className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100" onClick={onClose} aria-label="Fechar">
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3 sm:gap-3 sm:px-6">
              {saveError ? (
                <p className="w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 sm:flex-1">{saveError}</p>
              ) : null}
              {recuperacaoAuth ? (
                <p
                  className={
                    recuperacaoAuth.tipo === 'ok'
                      ? 'w-full rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900 sm:flex-1'
                      : 'w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 sm:flex-1'
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
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
                >
                  {recuperandoSenha ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  Recuperar Senha
                </button>
                <button
                  type="button"
                  onClick={() => void aoRemover()}
                  disabled={salvando || !onDelete}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50 disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" aria-hidden /> Remover Coordenador
                </button>
                {botaoSalvar}
              </div>
            </div>
          </>
        )}

        <div className="flex min-h-[480px] flex-1 flex-col overflow-hidden md:min-h-0 md:flex-row">
          <nav className="shrink-0 border-b border-slate-200 bg-slate-50/80 p-3 md:w-60 md:border-b-0 md:border-r md:p-4">
            <ul className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
              {ABAS.map(({ id, Icon, rotulo }) => (
                <li key={id} className="shrink-0 md:shrink">
                  <button
                    type="button"
                    onClick={() => setAba(id)}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors md:px-4',
                      aba === id
                        ? 'bg-white text-primary-700 shadow-sm ring-1 ring-slate-200'
                        : 'text-slate-600 hover:bg-white/70 hover:text-slate-900',
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" /> {rotulo}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6">
            {body}
          </div>
        </div>
      </div>
    </div>
  )
}
