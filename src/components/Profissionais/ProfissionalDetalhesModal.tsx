import {
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'
import {
  ArrowRight,
  Check,
  DollarSign,
  FileText,
  ListChecks,
  Loader2,
  Mail,
  MapPin,
  Palmtree,
  Paperclip,
  Search,
  UserRound,
  Users,
  Wallet,
  X,
  XCircle,
} from 'lucide-react'

import { cn } from '../../lib/cn'
import type { ProfissionalCompleto } from './profissionalTypes'

type AbaPerfil =
  | 'informacoes'
  | 'endereco'
  | 'grupos'
  | 'dados-bancarios'
  | 'faturamento'
  | 'contratacao'
  | 'afastamentos'
  | 'habilidades'
  | 'anexos'

const ABAS: {
  id: AbaPerfil
  rotulo: string
  Icon: ComponentType<{ className?: string }>
}[] = [
  { id: 'informacoes', rotulo: 'Informações', Icon: UserRound },
  { id: 'endereco', rotulo: 'Endereço', Icon: MapPin },
  { id: 'grupos', rotulo: 'Grupos', Icon: Users },
  { id: 'dados-bancarios', rotulo: 'Dados Bancários', Icon: Wallet },
  { id: 'faturamento', rotulo: 'Faturamento', Icon: DollarSign },
  { id: 'contratacao', rotulo: 'Contratação', Icon: FileText },
  { id: 'afastamentos', rotulo: 'Afastamentos', Icon: Palmtree },
  { id: 'habilidades', rotulo: 'Habilidades', Icon: ListChecks },
  { id: 'anexos', rotulo: 'Anexos', Icon: Paperclip },
]

const UFS_BR = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE',
  'TO',
] as const

const PROFISSOES = [
  'Médico(a)',
  'Enfermeiro(a)',
  'Técnico(a) em enfermagem',
  'Fisioterapeuta',
  'Outro',
] as const

export interface ProfissionalDetalhesModalProps {
  open: boolean
  profissional: ProfissionalCompleto | null
  onClose: () => void
}

interface FormInformacoes {
  nomeCompleto: string
  email: string
  telefone1: string
  telefone2: string
  dataNascimento: string
  profissao: string
  numeroCrm: string
  ufCrm: string
  rqe: string
  cns: string
  numeroRegistroCfm: string
  dataAdmissao: string
  codigo: string
  detalhesObservacao: string
  localPrincipal: string
}

function parseRegistroProfissional(reg: string): { num: string; uf: string } {
  const partes = reg.split('/').map((s) => s.trim())
  return { num: partes[0] ?? '', uf: partes[1] ?? '' }
}

function criarFormInformacoes(p: ProfissionalCompleto): FormInformacoes {
  const { num, uf } = parseRegistroProfissional(p.registroProfissional)
  return {
    nomeCompleto: p.nome,
    email: p.detalhes.email,
    telefone1: p.detalhes.telefone,
    telefone2: p.detalhes.celular,
    dataNascimento: p.detalhes.dataNascimento,
    profissao: p.profissao,
    numeroCrm: num,
    ufCrm: uf || 'PA',
    rqe: '',
    cns: '',
    numeroRegistroCfm: num,
    dataAdmissao: p.detalhes.contratacao.dataAdmissao,
    codigo: p.detalhes.contratacao.numeroContrato.replace(/\D/g, '').slice(0, 8),
    detalhesObservacao:
      `Local: ${p.localNome}\nSetores vinculados: ${p.setores.join(', ')}.`,
    localPrincipal: p.localNome,
  }
}

function iniciaisNome(nome: string) {
  const limpo = nome.replace(/^(Dr\.|Dra\.|Enf\.ª)\s*/i, '').trim()
  const partes = limpo.split(/\s+/).filter(Boolean)
  if (partes.length === 0) return '?'
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}

function Campo({
  rotulo,
  valor,
}: {
  rotulo: string
  valor: string
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {rotulo}
      </dt>
      <dd className="mt-1 text-sm leading-relaxed text-slate-900">{valor}</dd>
    </div>
  )
}

const inputEditavel =
  'w-full cursor-text rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20'

function FormLabel({ children, htmlFor }: { children: ReactNode; htmlFor: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500"
    >
      {children}
    </label>
  )
}

function SecaoTitulo({ children }: { children: ReactNode }) {
  return (
    <h3 className="border-b border-slate-200 pb-2 text-sm font-semibold text-slate-800">
      {children}
    </h3>
  )
}

function InformacoesFormulario({
  form,
  setForm,
  setores,
}: {
  form: FormInformacoes
  setForm: Dispatch<SetStateAction<FormInformacoes | null>>
  setores: string[]
}) {
  function patch<K extends keyof FormInformacoes>(campo: K, valor: FormInformacoes[K]) {
    setForm((prev) => (prev === null ? prev : { ...prev, [campo]: valor }))
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <SecaoTitulo>Dados pessoais</SecaoTitulo>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-x-4">
          <div className="lg:col-span-5">
            <FormLabel htmlFor="pf-nome">Nome completo</FormLabel>
            <input
              id="pf-nome"
              type="text"
              value={form.nomeCompleto}
              onChange={(e) => patch('nomeCompleto', e.target.value)}
              className={inputEditavel}
            />
          </div>
          <div className="lg:col-span-3">
            <FormLabel htmlFor="pf-email">E-mail</FormLabel>
            <input
              id="pf-email"
              type="email"
              value={form.email}
              onChange={(e) => patch('email', e.target.value)}
              className={inputEditavel}
            />
          </div>
          <div className="lg:col-span-2">
            <FormLabel htmlFor="pf-tel1">Telefone 1</FormLabel>
            <input
              id="pf-tel1"
              type="text"
              inputMode="tel"
              value={form.telefone1}
              onChange={(e) => patch('telefone1', e.target.value)}
              className={inputEditavel}
            />
          </div>
          <div className="lg:col-span-2">
            <FormLabel htmlFor="pf-tel2">Telefone 2</FormLabel>
            <input
              id="pf-tel2"
              type="text"
              inputMode="tel"
              value={form.telefone2}
              onChange={(e) => patch('telefone2', e.target.value)}
              className={inputEditavel}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6 lg:gap-x-4">
          <div>
            <FormLabel htmlFor="pf-nasc">Data de nascimento</FormLabel>
            <input
              id="pf-nasc"
              type="text"
              placeholder="dd/mm/aaaa"
              value={form.dataNascimento}
              onChange={(e) => patch('dataNascimento', e.target.value)}
              className={inputEditavel}
            />
          </div>
          <div>
            <FormLabel htmlFor="pf-prof">Profissão</FormLabel>
            <select
              id="pf-prof"
              value={form.profissao}
              onChange={(e) => patch('profissao', e.target.value)}
              className={cn(inputEditavel, 'cursor-pointer')}
            >
              {!PROFISSOES.includes(form.profissao as (typeof PROFISSOES)[number]) ? (
                <option value={form.profissao}>{form.profissao}</option>
              ) : null}
              {PROFISSOES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <FormLabel htmlFor="pf-crm">Nº CRM</FormLabel>
            <input
              id="pf-crm"
              type="text"
              value={form.numeroCrm}
              onChange={(e) => patch('numeroCrm', e.target.value)}
              className={inputEditavel}
            />
          </div>
          <div>
            <FormLabel htmlFor="pf-ufcr">UF CRM</FormLabel>
            <select
              id="pf-ufcr"
              value={form.ufCrm}
              onChange={(e) => patch('ufCrm', e.target.value)}
              className={cn(inputEditavel, 'cursor-pointer')}
            >
              {UFS_BR.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </select>
          </div>
          <div>
            <FormLabel htmlFor="pf-rqe">RQE</FormLabel>
            <input
              id="pf-rqe"
              type="text"
              value={form.rqe}
              onChange={(e) => patch('rqe', e.target.value)}
              className={inputEditavel}
              placeholder="—"
            />
          </div>
          <div>
            <FormLabel htmlFor="pf-cns">CNS</FormLabel>
            <input
              id="pf-cns"
              type="text"
              value={form.cns}
              onChange={(e) => patch('cns', e.target.value)}
              className={inputEditavel}
              placeholder="—"
            />
          </div>
        </div>

        <div>
          <FormLabel htmlFor="pf-local">Local principal</FormLabel>
          <input
            id="pf-local"
            type="text"
            value={form.localPrincipal}
            onChange={(e) => patch('localPrincipal', e.target.value)}
            className={inputEditavel}
          />
          <p className="mt-2 text-xs text-slate-500">Setores atuais (referência):</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {setores.map((s) => (
              <span
                key={s}
                className="rounded-md bg-teal-100 px-2.5 py-1 text-xs font-medium text-teal-900"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <SecaoTitulo>Dados do CFM</SecaoTitulo>
        <div className="max-w-md">
          <FormLabel htmlFor="pf-cfm">Nº registro</FormLabel>
          <input
            id="pf-cfm"
            type="text"
            value={form.numeroRegistroCfm}
            onChange={(e) => patch('numeroRegistroCfm', e.target.value)}
            className={inputEditavel}
          />
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md border border-[#2563eb] bg-white px-4 py-2 text-sm font-medium text-[#2563eb] shadow-sm transition-colors hover:bg-blue-50"
        >
          <Search className="h-4 w-4 shrink-0" aria-hidden />
          Buscar no CFM
        </button>
      </section>

      <section className="space-y-4">
        <SecaoTitulo>Outros detalhes</SecaoTitulo>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FormLabel htmlFor="pf-adm">Data de admissão</FormLabel>
            <input
              id="pf-adm"
              type="text"
              value={form.dataAdmissao}
              onChange={(e) => patch('dataAdmissao', e.target.value)}
              className={inputEditavel}
            />
          </div>
          <div>
            <FormLabel htmlFor="pf-cod">Código</FormLabel>
            <input
              id="pf-cod"
              type="text"
              value={form.codigo}
              onChange={(e) => patch('codigo', e.target.value)}
              className={inputEditavel}
            />
          </div>
        </div>
        <div>
          <FormLabel htmlFor="pf-detalhes">Detalhes</FormLabel>
          <textarea
            id="pf-detalhes"
            rows={5}
            value={form.detalhesObservacao}
            onChange={(e) => patch('detalhesObservacao', e.target.value)}
            className={cn(inputEditavel, 'resize-y min-h-[120px]')}
          />
          <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
            Insira aqui observações sobre este profissional. O profissional não tem acesso
            a essas informações.
          </p>
        </div>
      </section>
    </div>
  )
}

export function ProfissionalDetalhesModal({
  open,
  profissional,
  onClose,
}: ProfissionalDetalhesModalProps) {
  const [aba, setAba] = useState<AbaPerfil>('informacoes')
  const [salvando, setSalvando] = useState(false)
  const [formInformacoes, setFormInformacoes] = useState<FormInformacoes | null>(null)

  useEffect(() => {
    if (open && profissional) setAba('informacoes')
  }, [open, profissional?.id])

  useEffect(() => {
    if (open && profissional) {
      setFormInformacoes(criarFormInformacoes(profissional))
    }
  }, [open, profissional])

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

  const subtitle = useMemo(() => {
    if (!profissional) return ''
    return `${profissional.profissao} ${profissional.detalhes.siglaConselho} ${profissional.registroProfissional}`
  }, [profissional])

  if (!open || !profissional) return null

  const { detalhes: d } = profissional

  function aoSalvar() {
    setSalvando(true)
    window.setTimeout(() => setSalvando(false), 1200)
  }

  let conteudo: ReactNode
  switch (aba) {
    case 'informacoes':
      conteudo =
        formInformacoes ? (
          <InformacoesFormulario
            form={formInformacoes}
            setForm={setFormInformacoes}
            setores={profissional.setores}
          />
        ) : null
      break
    case 'endereco':
      conteudo = (
        <dl className="grid max-w-xl gap-6">
          <Campo rotulo="CEP" valor={d.endereco.cep} />
          <Campo
            rotulo="Logradouro"
            valor={`${d.endereco.logradouro}${d.endereco.numero ? `, ${d.endereco.numero}` : ''}${d.endereco.complemento ? ` — ${d.endereco.complemento}` : ''}`}
          />
          <Campo rotulo="Bairro" valor={d.endereco.bairro} />
          <Campo rotulo="Cidade / UF" valor={`${d.endereco.cidade} / ${d.endereco.uf}`} />
        </dl>
      )
      break
    case 'grupos':
      conteudo =
        d.grupos.length === 0 ? (
          <p className="text-sm text-slate-600">
            Nenhum grupo cadastrado para este profissional.
          </p>
        ) : (
          <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
            {d.grupos.map((g) => (
              <li
                key={g.id}
                className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="font-medium text-slate-900">{g.nome}</span>
                <span className="text-sm text-slate-500">{g.local}</span>
              </li>
            ))}
          </ul>
        )
      break
    case 'dados-bancarios':
      conteudo = (
        <dl className="grid gap-6 sm:grid-cols-2">
          <Campo rotulo="Banco" valor={d.dadosBancarios.banco} />
          <Campo rotulo="Agência" valor={d.dadosBancarios.agencia} />
          <Campo rotulo="Conta" valor={d.dadosBancarios.conta} />
          <Campo rotulo="Tipo de conta" valor={d.dadosBancarios.tipoConta} />
          <div className="sm:col-span-2">
            <Campo
              rotulo="Chave Pix"
              valor={d.dadosBancarios.pix.trim() ? d.dadosBancarios.pix : '—'}
            />
          </div>
        </dl>
      )
      break
    case 'faturamento':
      conteudo = (
        <div className="max-w-2xl space-y-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
          {d.resumoFaturamento}
        </div>
      )
      break
    case 'contratacao':
      conteudo = (
        <dl className="grid gap-6 sm:grid-cols-2">
          <Campo rotulo="Regime / vínculo" valor={d.contratacao.regime} />
          <Campo rotulo="Data de admissão" valor={d.contratacao.dataAdmissao} />
          <Campo rotulo="Carga horária" valor={d.contratacao.cargaHorariaSemanal} />
          <Campo rotulo="Número do contrato" valor={d.contratacao.numeroContrato} />
        </dl>
      )
      break
    case 'afastamentos':
      conteudo =
        d.afastamentos.length === 0 ? (
          <p className="text-sm text-slate-600">Sem afastamentos registrados.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-2 font-semibold text-slate-700">Início</th>
                  <th className="px-4 py-2 font-semibold text-slate-700">Fim</th>
                  <th className="px-4 py-2 font-semibold text-slate-700">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {d.afastamentos.map((a, idx) => (
                  <tr key={`${a.inicio}-${idx}`} className="border-b border-slate-100">
                    <td className="px-4 py-3 text-slate-800">{a.inicio}</td>
                    <td className="px-4 py-3 text-slate-800">{a.fim}</td>
                    <td className="px-4 py-3 text-slate-600">{a.motivo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      break
    case 'habilidades':
      conteudo = (
        <ul className="flex flex-wrap gap-2">
          {d.habilidades.map((h) => (
            <li
              key={h}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800"
            >
              {h}
            </li>
          ))}
        </ul>
      )
      break
    case 'anexos':
      conteudo =
        d.anexos.length === 0 ? (
          <p className="text-sm text-slate-600">Nenhum anexo enviado.</p>
        ) : (
          <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
            {d.anexos.map((a) => (
              <li
                key={a.nome}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
              >
                <span className="cursor-pointer font-medium text-[#2563eb] underline-offset-4 hover:underline">
                  {a.nome}
                </span>
                <span className="text-xs text-slate-500">
                  {a.tipo} · {a.enviadoEm}
                </span>
              </li>
            ))}
          </ul>
        )
      break
    default:
      conteudo = null
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
        onClick={onClose}
        aria-label="Fechar modal"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="profissional-modal-title"
        className="relative z-10 flex max-h-[min(90vh,880px)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10"
      >
        <div className="shrink-0 border-b border-slate-200">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-5">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                {d.fotoUrl ? (
                  <img
                    src={d.fotoUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs font-semibold uppercase text-[#2563eb]">
                    {iniciaisNome(profissional.nome)}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h2
                  id="profissional-modal-title"
                  className="truncate text-base font-semibold text-[#2563eb] lg:text-lg"
                >
                  {profissional.nome}
                </h2>
                <p className="truncate text-sm text-slate-500">{subtitle}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-slate-200/80 bg-slate-50 px-4 py-3 sm:gap-4 sm:px-5">
            <span className="text-sm font-medium text-slate-600">Opções:</span>
            <button
              type="button"
              className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-400 hover:bg-slate-50"
            >
              <span className="inline-flex shrink-0 items-center gap-0.5 text-slate-600" aria-hidden>
                <Mail className="h-4 w-4" />
                <ArrowRight className="h-3 w-3 opacity-80" />
              </span>
              Recuperar Senha
            </button>
            <button
              type="button"
              className="inline-flex h-10 items-center gap-2 rounded-md border border-danger-600 bg-white px-3 text-sm font-medium text-danger-600 shadow-sm hover:bg-red-50"
            >
              <XCircle className="h-4 w-4 shrink-0 text-danger-600" aria-hidden strokeWidth={2} />
              Remover Profissional
            </button>
            <button
              type="button"
              onClick={aoSalvar}
              disabled={salvando}
              className={cn(
                'inline-flex h-10 min-w-[158px] items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold text-white shadow-sm',
                salvando ? 'bg-sky-400' : 'bg-[#2563eb] hover:bg-[#1d4ed8]',
                'disabled:cursor-not-allowed',
              )}
            >
              {salvando ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Aguarde...
                </>
              ) : (
                <>
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/25">
                    <Check className="h-3.5 w-3.5 stroke-[2.5] text-white" aria-hidden />
                  </span>
                  Salvar Alterações
                </>
              )}
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col md:flex-row md:min-h-[360px]">
          <nav
            className="flex max-h-[40vh] w-full shrink-0 flex-row gap-0 overflow-x-auto overflow-y-auto border-b border-slate-200 bg-white py-2 md:w-52 md:max-h-none md:flex-col md:border-b-0 md:border-r lg:w-56"
            aria-label="Seções do perfil"
          >
            {ABAS.map(({ id, rotulo, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setAba(id)}
                className={cn(
                  'flex min-w-fit shrink-0 items-center gap-3 border-b-4 border-transparent px-3 py-2.5 text-left text-sm font-medium transition-colors md:w-full md:border-b-0 md:border-l-4 md:border-l-transparent md:px-4',
                  id === aba
                    ? 'border-b-[#2563eb] bg-blue-50/60 text-[#2563eb] md:border-b-transparent md:border-l-[#2563eb]'
                    : 'text-slate-600 hover:bg-slate-50',
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 shrink-0',
                    id === aba ? 'text-[#2563eb]' : 'text-slate-400',
                  )}
                  aria-hidden
                />
                {rotulo}
              </button>
            ))}
          </nav>

          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-slate-100">
            <div className="p-4 sm:p-6">
              <div className="rounded-lg border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6">
                {conteudo}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
