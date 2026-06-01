import {
  useEffect,
  useId,
  useMemo,
  useState,
  type ComponentType,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  DollarSign,
  FileText,
  ListChecks,
  Loader2,
  Mail,
  Trash2,
  MapPin,
  Palmtree,
  Paperclip,
  Plus,
  Search,
  ShieldCheck,
  Shuffle,
  Star,
  UserRound,
  Users,
  Wallet,
  X,
  XCircle,
} from 'lucide-react'

import { cn } from '../../lib/cn'
import { DocumentosProfissionalPanel } from './DocumentosProfissionalPanel'
import { useContaMembro } from '../../hooks/useContaMembro'
import { supabase } from '../../lib/supabase'
import type {
  ProfissionalCompleto,
  ProfissionalAfastamento,
  ProfissionalAnexo,
  ProfissionalContaBancaria,
  ProfissionalDetalhes,
  ProfissionalPeriodoContratacao,
} from './profissionalTypes'

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
  | 'documentos'

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
  { id: 'documentos', rotulo: 'Documentos', Icon: ShieldCheck },
]

export const UFS_BR = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE',
  'TO',
] as const

/** Capitais para sugestões de cidade (datalist). */
const CAPITAL_POR_UF: Record<string, string> = {
  AC: 'Rio Branco',
  AL: 'Maceió',
  AP: 'Macapá',
  AM: 'Manaus',
  BA: 'Salvador',
  CE: 'Fortaleza',
  DF: 'Brasília',
  ES: 'Vitória',
  GO: 'Goiânia',
  MA: 'São Luís',
  MT: 'Cuiabá',
  MS: 'Campo Grande',
  MG: 'Belo Horizonte',
  PA: 'Belém',
  PB: 'João Pessoa',
  PR: 'Curitiba',
  PE: 'Recife',
  PI: 'Teresina',
  RJ: 'Rio de Janeiro',
  RN: 'Natal',
  RS: 'Porto Alegre',
  RO: 'Porto Velho',
  RR: 'Boa Vista',
  SC: 'Florianópolis',
  SP: 'São Paulo',
  SE: 'Aracaju',
  TO: 'Palmas',
}

const EXTRAS_CIDADES_POR_UF: Record<string, string[]> = {
  PA: ['Ananindeua', 'Marituba', 'Castanhal', 'Santarém', 'Paragominas'],
  AM: ['Parintins', 'Itacoatiara'],
  RJ: ['Niterói', 'Campos dos Goytacazes'],
  SP: ['Campinas', 'Santos', 'Guarulhos', 'Sorocaba', 'Ribeirão Preto'],
}

function cidadesSugeridasParaUf(uf: string): string[] {
  const cap = CAPITAL_POR_UF[uf]
  const extras = EXTRAS_CIDADES_POR_UF[uf] ?? []
  const set = new Set<string>()
  if (cap) set.add(cap)
  extras.forEach((c) => set.add(c))
  return Array.from(set)
}

export const PROFISSOES = [
  'Médico(a)',
  'Enfermeiro(a)',
  'Técnico(a) em enfermagem',
  'Fisioterapeuta',
  'Outro',
] as const

export const TIPOS_AFASTAMENTO = [
  'Atestado Médico',
  'Licença médica',
  'Licença maternidade',
  'Férias',
  'Outro',
] as const

export const TIPOS_CONTRATACAO = [
  'CLT',
  'PJ',
  'Cooperado / credenciado',
  'Temporário',
  'Estágio',
  'RPA',
  'Outro',
] as const

export const TIPOS_TRANSACAO_CONTA = [
  'Conta corrente',
  'Conta poupança',
  'Conta salário',
  'Chave PIX',
  'Outro',
] as const

export const OPCOES_CONTA_PRINCIPAL = ['Sim', 'Não'] as const

export type LocalOpcaoModal = { id: string; nome: string }

export type SetorArvoreOpcao = { id: string; nome: string }

export type LocalComSetoresArvore = {
  id: string
  nome: string
  setores: SetorArvoreOpcao[]
}

export interface ProfissionalDetalhesModalProps {
  open: boolean
  profissional: ProfissionalCompleto | null
  /** Locais ativos cadastrados (ex.: mesma lista da página de profissionais). */
  locaisOpcoes: LocalOpcaoModal[]
  /** Árvore local → setores para a aba Grupos. */
  locaisComSetoresArvore: LocalComSetoresArvore[]
  onClose: () => void
  onSave?: (
    profissionalId: string,
    form: FormInformacoes,
  ) => Promise<{ error?: string }>
  onDelete?: (profissionalId: string) => Promise<{ error?: string }>
}

export interface FormInformacoes {
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
  habilidades: string[]
  anexos: ProfissionalAnexo[]
  /** Id em `public.locais`; vazio = sem local principal. */
  localId: string
  enderecoCep: string
  enderecoRua: string
  enderecoNumero: string
  enderecoBairro: string
  enderecoComplemento: string
  enderecoUf: string
  enderecoCidade: string
  /** Ids de `setores` vinculados ao profissional (`profissional_setores`). */
  setoresVinculadosIds: string[]
  /** CPF (cadastro e faturamento). */
  cpf: string
  faturamentoCnpj: string
  faturamentoRazaoSocial: string
  faturamentoNomeFantasia: string
  periodosContratacao: ProfissionalPeriodoContratacao[]
  afastamentos: ProfissionalAfastamento[]
  contasBancarias: ProfissionalContaBancaria[]
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
    rqe: p.detalhes.rqe?.trim() ?? '',
    cns: p.detalhes.cns?.trim() ?? '',
    numeroRegistroCfm: (p.detalhes.numeroRegistroCfm?.trim() || num || '').trim(),
    dataAdmissao: p.detalhes.contratacao.dataAdmissao,
    codigo: p.detalhes.contratacao.numeroContrato,
    detalhesObservacao:
      p.detalhes.observacaoInterna?.trim() ??
      `Local: ${p.localNome}\nSetores vinculados: ${p.setores.join(', ')}.`,
    localId: p.localId ?? '',
    enderecoCep: p.detalhes.endereco.cep,
    enderecoRua: p.detalhes.endereco.logradouro,
    enderecoNumero: p.detalhes.endereco.numero,
    enderecoBairro: p.detalhes.endereco.bairro,
    enderecoComplemento: p.detalhes.endereco.complemento,
    enderecoUf: p.detalhes.endereco.uf || 'PA',
    enderecoCidade: p.detalhes.endereco.cidade,
    setoresVinculadosIds: [...(p.setorIdsVinculados ?? [])],
    cpf: p.detalhes.cpf,
    faturamentoCnpj: p.detalhes.faturamentoCnpj ?? '',
    faturamentoRazaoSocial: p.detalhes.faturamentoRazaoSocial ?? '',
    faturamentoNomeFantasia: p.detalhes.faturamentoNomeFantasia ?? '',
    periodosContratacao: (p.detalhes.periodosContratacao ?? []).map((x) => ({ ...x })),
    afastamentos: p.detalhes.afastamentos.map((a) => ({ ...a })),
    contasBancarias: (p.detalhes.contasBancarias ?? []).map((c) => ({ ...c })),
    habilidades: [...p.detalhes.habilidades],
    anexos: p.detalhes.anexos.map((a) => ({ ...a })),
  }
}

function iniciaisNome(nome: string) {
  const limpo = nome.replace(/^(Dr\.|Dra\.|Enf\.ª)\s*/i, '').trim()
  const partes = limpo.split(/\s+/).filter(Boolean)
  if (partes.length === 0) return '?'
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
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

function celulaPlaceholderLegado(valor: string) {
  const t = valor.trim()
  if (t) return <span className="text-slate-800">{t}</span>
  return (
    <span className="select-none tracking-[0.35em] text-slate-400" aria-hidden>
      ······
    </span>
  )
}

function novoIdContaBancaria() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `cb-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

function DadosBancariosAba({
  detalhes,
  form,
  setForm,
}: {
  detalhes: ProfissionalDetalhes
  form: FormInformacoes
  setForm: Dispatch<SetStateAction<FormInformacoes | null>>
}) {
  const [formularioAberto, setFormularioAberto] = useState(false)
  const [rascunho, setRascunho] = useState<{
    tipo: string
    tornarPrincipal: ProfissionalContaBancaria['tornarPrincipal']
  }>({ tipo: '', tornarPrincipal: 'Sim' })
  const [erroRascunho, setErroRascunho] = useState<string | null>(null)

  const db = detalhes.dadosBancarios
  const labelDb =
    'mb-1 block text-sm font-medium text-slate-600'
  const campoDb =
    'w-full max-w-md rounded border border-[#DDDDDD] bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition-colors focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20'

  const indiceTransacao = form.contasBancarias.length + 1

  function abrirFormulario() {
    setRascunho({ tipo: '', tornarPrincipal: 'Sim' })
    setErroRascunho(null)
    setFormularioAberto(true)
  }

  function fecharFormulario() {
    setFormularioAberto(false)
    setErroRascunho(null)
  }

  function salvarConta() {
    if (!rascunho.tipo.trim()) {
      setErroRascunho('Selecione o tipo.')
      return
    }
    setErroRascunho(null)
    setForm((prev) => {
      if (!prev) return prev
      let lista = prev.contasBancarias.map((c) => ({ ...c }))
      if (rascunho.tornarPrincipal === 'Sim') {
        lista = lista.map((c) => ({ ...c, tornarPrincipal: 'Não' as const }))
      }
      return {
        ...prev,
        contasBancarias: [
          ...lista,
          {
            id: novoIdContaBancaria(),
            tipo: rascunho.tipo.trim(),
            tornarPrincipal: rascunho.tornarPrincipal,
          },
        ],
      }
    })
    fecharFormulario()
  }

  function removerConta(id: string) {
    setForm((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        contasBancarias: prev.contasBancarias.filter((c) => c.id !== id),
      }
    })
  }

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100/70 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200/90 bg-slate-100/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <h3 className="text-sm font-bold text-slate-900">1. Dados antigos</h3>
          <button
            type="button"
            className="inline-flex w-fit shrink-0 items-center justify-center gap-2 rounded-md border border-[#2563eb] bg-white px-3 py-2 text-sm font-medium text-[#2563eb] shadow-sm transition-colors hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
          >
            <Shuffle className="h-4 w-4 shrink-0" aria-hidden />
            Migrar dados
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/95">
                <th className="whitespace-nowrap px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-600 sm:px-4">
                  Cód. Banco
                </th>
                <th className="whitespace-nowrap px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-600 sm:px-4">
                  Agência
                </th>
                <th className="whitespace-nowrap px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-600 sm:px-4">
                  C. Corrente
                </th>
                <th className="whitespace-nowrap px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-600 sm:px-4">
                  Operação
                </th>
                <th className="whitespace-nowrap px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-600 sm:px-4">
                  CPF - CNPJ
                </th>
                <th className="whitespace-nowrap px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-600 sm:px-4">
                  Razão social
                </th>
                <th className="whitespace-nowrap px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-600 sm:px-4">
                  Nome fantasia
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-slate-100/50">
                <td className="border-t border-slate-100 px-3 py-3.5 sm:px-4">
                  {celulaPlaceholderLegado(db.banco)}
                </td>
                <td className="border-t border-slate-100 px-3 py-3.5 sm:px-4">
                  {celulaPlaceholderLegado(db.agencia)}
                </td>
                <td className="border-t border-slate-100 px-3 py-3.5 sm:px-4">
                  {celulaPlaceholderLegado(db.conta)}
                </td>
                <td className="border-t border-slate-100 px-3 py-3.5 sm:px-4">
                  {celulaPlaceholderLegado(db.tipoConta)}
                </td>
                <td className="border-t border-slate-100 px-3 py-3.5 sm:px-4">
                  {celulaPlaceholderLegado(detalhes.cpf)}
                </td>
                <td className="border-t border-slate-100 px-3 py-3.5 sm:px-4">
                  {celulaPlaceholderLegado('')}
                </td>
                <td className="border-t border-slate-100 px-3 py-3.5 sm:px-4">
                  {celulaPlaceholderLegado('')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <h3 className="text-sm font-bold text-slate-900">2. Contas bancárias</h3>
          <span className="rounded-md bg-sky-100 px-2.5 py-1 text-[10px] font-bold uppercase leading-none tracking-wide text-sky-950">
            NOVIDADE!
          </span>
        </div>

        {form.contasBancarias.length > 0 ? (
          <ul className="space-y-2 rounded-lg border border-slate-200/80 bg-slate-50/50 p-2">
            {form.contasBancarias.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm"
              >
                <div className="min-w-0">
                  <span className="font-medium text-slate-900">{c.tipo}</span>
                  {c.tornarPrincipal === 'Sim' ? (
                    <span className="ml-2 inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-900">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden />
                      Principal
                    </span>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => removerConta(c.id)}
                  className="shrink-0 rounded-md p-1.5 text-danger-600 hover:bg-red-50"
                  aria-label="Remover conta"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {formularioAberto ? (
          <div className="rounded-xl border-2 border-[#2563eb] bg-slate-50/90 p-4 shadow-sm sm:p-5">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h4 className="text-base font-bold text-[#1e3a8a]">
                {indiceTransacao}. Transação
              </h4>
              <div className="flex flex-wrap items-center gap-4 sm:justify-end">
                <button
                  type="button"
                  onClick={fecharFormulario}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition-colors hover:text-slate-900"
                >
                  Cancelar
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-400 bg-white text-slate-700 shadow-sm"
                    aria-hidden
                  >
                    <ArrowLeft className="h-4 w-4" strokeWidth={2.25} />
                  </span>
                </button>
                <button
                  type="button"
                  onClick={salvarConta}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-600 transition-colors hover:text-cyan-700"
                >
                  Salvar
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500 text-white shadow-sm"
                    aria-hidden
                  >
                    <Check className="h-4 w-4" strokeWidth={2.5} />
                  </span>
                </button>
              </div>
            </div>
            {erroRascunho ? (
              <p className="mb-3 text-sm text-red-600" role="alert">
                {erroRascunho}
              </p>
            ) : null}
            <div className="max-w-md space-y-4">
              <div>
                <label htmlFor="db-tipo-trans" className={labelDb}>
                  Tipo <span className="font-semibold text-[#2563eb]">*</span>
                </label>
                <select
                  id="db-tipo-trans"
                  value={rascunho.tipo}
                  onChange={(e) => setRascunho((r) => ({ ...r, tipo: e.target.value }))}
                  className={cn(campoDb, 'cursor-pointer')}
                >
                  <option value="">Selecione</option>
                  {TIPOS_TRANSACAO_CONTA.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="db-principal" className={labelDb}>
                  Tornar principal{' '}
                  <Star
                    className="inline-block h-3.5 w-3.5 align-text-bottom fill-amber-400 text-amber-400"
                    aria-hidden
                  />
                </label>
                <select
                  id="db-principal"
                  value={rascunho.tornarPrincipal}
                  onChange={(e) =>
                    setRascunho((r) => ({
                      ...r,
                      tornarPrincipal: e.target.value as ProfissionalContaBancaria['tornarPrincipal'],
                    }))
                  }
                  className={cn(campoDb, 'cursor-pointer')}
                >
                  {OPCOES_CONTA_PRINCIPAL.map((op) => (
                    <option key={op} value={op}>
                      {op}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ) : null}

        {!formularioAberto ? (
          <button
            type="button"
            onClick={abrirFormulario}
            className="flex w-full items-center justify-center rounded-xl border-2 border-[#2563eb] bg-white py-14 px-6 text-sm font-medium text-[#2563eb] shadow-sm transition-colors hover:bg-blue-50/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
          >
            <span className="inline-flex items-center gap-2">
              <Plus className="h-5 w-5 shrink-0" aria-hidden />
              Adicionar conta bancária
            </span>
          </button>
        ) : null}
      </section>
    </div>
  )
}

function FaturamentoFormulario({
  form,
  setForm,
}: {
  form: FormInformacoes
  setForm: Dispatch<SetStateAction<FormInformacoes | null>>
}) {
  function patch<K extends keyof FormInformacoes>(campo: K, valor: FormInformacoes[K]) {
    setForm((prev) => (prev === null ? prev : { ...prev, [campo]: valor }))
  }

  const labelFaturamento =
    'mb-1.5 block text-xs font-medium normal-case text-slate-500'

  return (
    <div className="space-y-5">
      <p className="text-sm leading-relaxed text-slate-600">
        Informe os dados de faturamento do profissional.
      </p>
      <div className="space-y-5 rounded-xl bg-slate-50 px-1 py-5 sm:px-4 sm:py-6">
        <div className="max-w-[220px]">
          <label htmlFor="pf-fat-cpf" className={labelFaturamento}>
            CPF
          </label>
          <input
            id="pf-fat-cpf"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={form.cpf}
            onChange={(e) => patch('cpf', e.target.value)}
            className={inputEditavel}
          />
        </div>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
          <div className="max-w-[220px] shrink-0">
            <label htmlFor="pf-fat-cnpj" className={labelFaturamento}>
              CNPJ
            </label>
            <input
              id="pf-fat-cnpj"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={form.faturamentoCnpj}
              onChange={(e) => patch('faturamentoCnpj', e.target.value)}
              className={inputEditavel}
            />
          </div>
          <div className="min-w-0 flex-1">
            <label htmlFor="pf-fat-razao" className={labelFaturamento}>
              Razão social
            </label>
            <input
              id="pf-fat-razao"
              type="text"
              autoComplete="organization"
              value={form.faturamentoRazaoSocial}
              onChange={(e) => patch('faturamentoRazaoSocial', e.target.value)}
              className={inputEditavel}
            />
          </div>
        </div>
        <div>
          <label htmlFor="pf-fat-nomefant" className={labelFaturamento}>
            Nome fantasia
          </label>
          <input
            id="pf-fat-nomefant"
            type="text"
            autoComplete="off"
            value={form.faturamentoNomeFantasia}
            onChange={(e) => patch('faturamentoNomeFantasia', e.target.value)}
            className={inputEditavel}
          />
        </div>
      </div>
    </div>
  )
}

function novoIdLista() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

function ContratacaoFormulario({
  form,
  setForm,
}: {
  form: FormInformacoes
  setForm: Dispatch<SetStateAction<FormInformacoes | null>>
}) {
  const [rascunhoAberto, setRascunhoAberto] = useState(false)
  const [rascunho, setRascunho] = useState<{
    tipo: (typeof TIPOS_CONTRATACAO)[number]
    inicio: string
    fim: string
    comentario: string
  }>({
    tipo: TIPOS_CONTRATACAO[0],
    inicio: '',
    fim: '',
    comentario: '',
  })
  const [erroRascunho, setErroRascunho] = useState<string | null>(null)

  const labelContr =
    'mb-1 block text-xs font-medium text-[#666666]'

  const campoContr =
    'w-full min-w-0 rounded border border-[#DDDDDD] bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20'

  function abrirRascunho() {
    setRascunho({
      tipo: TIPOS_CONTRATACAO[0],
      inicio: '',
      fim: '',
      comentario: '',
    })
    setErroRascunho(null)
    setRascunhoAberto(true)
  }

  function fecharRascunho() {
    setRascunhoAberto(false)
    setErroRascunho(null)
  }

  function confirmarRascunho() {
    if (!rascunho.tipo.trim()) {
      setErroRascunho('Selecione o tipo.')
      return
    }
    if (!rascunho.inicio.trim()) {
      setErroRascunho('Preencha o campo Início.')
      return
    }
    setErroRascunho(null)
    setForm((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        periodosContratacao: [
          ...prev.periodosContratacao,
          {
            id: novoIdLista(),
            tipo: rascunho.tipo.trim(),
            inicio: rascunho.inicio.trim(),
            fim: rascunho.fim.trim(),
            comentario: rascunho.comentario.trim(),
          },
        ],
      }
    })
    fecharRascunho()
  }

  function removerPeriodo(id: string) {
    setForm((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        periodosContratacao: prev.periodosContratacao.filter((p) => p.id !== id),
      }
    })
  }

  const lista = form.periodosContratacao

  return (
    <div className="space-y-5">
      <p className="text-sm leading-relaxed text-slate-600">
        Adicione os períodos de contratação para o profissional.
      </p>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-3 bg-slate-100 px-4 py-3 sm:px-5">
          <span className="text-sm font-bold text-slate-700">Tipo</span>
          <span className="text-center text-sm font-bold text-slate-700">Período</span>
          <span className="text-right text-sm font-bold text-slate-700">Opções</span>
        </div>

        {lista.length > 0 ? (
          <ul className="divide-y divide-slate-100 border-t border-slate-100">
            {lista.map((item) => (
              <li
                key={item.id}
                className="grid grid-cols-1 items-center gap-3 bg-white px-4 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:px-5"
              >
                <p className="text-sm font-medium text-slate-900">{item.tipo}</p>
                <div className="space-y-1 text-center sm:text-center">
                  <p className="text-sm text-slate-900">
                    {item.inicio}
                    {item.fim ? ` – ${item.fim}` : ''}
                  </p>
                  {item.comentario ? (
                    <p className="text-xs leading-relaxed text-slate-500">{item.comentario}</p>
                  ) : null}
                </div>
                <div className="flex justify-end sm:min-w-[4.5rem]">
                  <button
                    type="button"
                    onClick={() => removerPeriodo(item.id)}
                    className="inline-flex items-center gap-1 rounded-md p-2 text-sm font-medium text-danger-600 hover:bg-red-50"
                    aria-label="Remover período"
                  >
                    <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : null}

        {rascunhoAberto ? (
          <div className="border border-slate-200 border-t-slate-100 bg-white px-4 py-4 sm:px-5">
            {erroRascunho ? (
              <p className="mb-3 text-sm text-red-600" role="alert">
                {erroRascunho}
              </p>
            ) : null}
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:gap-4">
              <div className="w-full shrink-0 sm:max-w-[11rem]">
                <label htmlFor="ct-ras-tipo" className={labelContr}>
                  Tipo
                  <span className="font-semibold text-[#2563eb]"> *</span>
                </label>
                <select
                  id="ct-ras-tipo"
                  value={rascunho.tipo}
                  onChange={(e) => setRascunho((r) => ({ ...r, tipo: e.target.value as (typeof TIPOS_CONTRATACAO)[number] }))}
                  className={cn(campoContr, 'cursor-pointer')}
                >
                  {TIPOS_CONTRATACAO.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-full shrink-0 sm:max-w-[11rem]">
                <label htmlFor="ct-ras-inicio" className={labelContr}>
                  Início
                  <span className="font-semibold text-[#2563eb]"> *</span>
                </label>
                <input
                  id="ct-ras-inicio"
                  type="text"
                  placeholder="dd/mm/aaaa"
                  value={rascunho.inicio}
                  onChange={(e) => setRascunho((r) => ({ ...r, inicio: e.target.value }))}
                  className={campoContr}
                />
              </div>
              <div className="w-full shrink-0 sm:max-w-[11rem]">
                <label htmlFor="ct-ras-fim" className={labelContr}>
                  Fim
                </label>
                <input
                  id="ct-ras-fim"
                  type="text"
                  placeholder="dd/mm/aaaa"
                  value={rascunho.fim}
                  onChange={(e) => setRascunho((r) => ({ ...r, fim: e.target.value }))}
                  className={campoContr}
                />
              </div>
              <div className="min-w-0 flex-1">
                <label htmlFor="ct-ras-coment" className={labelContr}>
                  Comentário
                </label>
                <input
                  id="ct-ras-coment"
                  type="text"
                  value={rascunho.comentario}
                  onChange={(e) => setRascunho((r) => ({ ...r, comentario: e.target.value }))}
                  className={campoContr}
                />
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-4 border-t border-slate-100 pt-4 xl:border-t-0 xl:pt-0">
                <button
                  type="button"
                  onClick={fecharRascunho}
                  className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 transition-colors hover:text-slate-900"
                >
                  Cancelar
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-600 text-white shadow-sm"
                    aria-hidden
                  >
                    <X className="h-4 w-4" strokeWidth={2.5} />
                  </span>
                </button>
                <button
                  type="button"
                  onClick={confirmarRascunho}
                  className="inline-flex items-center gap-2 text-sm font-bold text-[#2563eb] transition-colors hover:text-[#1d4ed8]"
                >
                  Adicionar
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-[#28a745] text-white shadow-sm"
                    aria-hidden
                  >
                    <Check className="h-4 w-4" strokeWidth={2.5} />
                  </span>
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="border-t border-slate-100 p-3 sm:p-4">
          {!rascunhoAberto ? (
            <button
              type="button"
              onClick={abrirRascunho}
              className="flex w-full items-center justify-center rounded-xl border-2 border-[#2563eb] bg-white py-14 px-6 text-sm font-medium text-[#2563eb] shadow-sm transition-colors hover:bg-blue-50/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
            >
              <span className="inline-flex items-center gap-2">
                <Plus className="h-5 w-5 shrink-0" aria-hidden />
                Adicionar novo período
              </span>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function AfastamentosFormulario({
  form,
  setForm,
}: {
  form: FormInformacoes
  setForm: Dispatch<SetStateAction<FormInformacoes | null>>
}) {
  const [rascunhoAberto, setRascunhoAberto] = useState(false)
  const [rascunho, setRascunho] = useState<{
    inicio: string
    fim: string
    tipo: (typeof TIPOS_AFASTAMENTO)[number]
    comentario: string
  }>({
    inicio: '',
    fim: '',
    tipo: TIPOS_AFASTAMENTO[0],
    comentario: '',
  })
  const [erroRascunho, setErroRascunho] = useState<string | null>(null)

  const labelAfast = 'mb-1 block text-xs font-medium text-[#666666]'

  function abrirNovoRascunho() {
    setRascunho({
      inicio: '',
      fim: '',
      tipo: TIPOS_AFASTAMENTO[0],
      comentario: '',
    })
    setErroRascunho(null)
    setRascunhoAberto(true)
  }

  function fecharRascunho() {
    setRascunhoAberto(false)
    setErroRascunho(null)
  }

  function confirmarRascunho() {
    if (!rascunho.inicio.trim()) {
      setErroRascunho('Preencha o campo Início.')
      return
    }
    if (!rascunho.tipo.trim()) {
      setErroRascunho('Selecione o tipo.')
      return
    }
    setErroRascunho(null)
    setForm((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        afastamentos: [
          ...prev.afastamentos,
          {
            id: novoIdLista(),
            inicio: rascunho.inicio.trim(),
            fim: rascunho.fim.trim(),
            tipo: rascunho.tipo.trim(),
            comentario: rascunho.comentario.trim(),
          },
        ],
      }
    })
    fecharRascunho()
  }

  function remover(id: string) {
    setForm((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        afastamentos: prev.afastamentos.filter((a) => a.id !== id),
      }
    })
  }

  const lista = form.afastamentos
  const campoData =
    'w-full min-w-0 rounded border border-[#DDDDDD] bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20'

  return (
    <div className="space-y-5">
      <p className="text-sm font-bold leading-relaxed text-slate-800">
        Gerencie os períodos de afastamento para o profissional.
      </p>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-3 bg-slate-100 px-4 py-3 sm:px-5">
          <span className="text-sm font-bold text-slate-700">Período</span>
          <span className="text-center text-sm font-bold text-slate-700">Tipo</span>
          <span className="text-right text-sm font-bold text-slate-700">Opções</span>
        </div>

        {lista.length > 0 ? (
          <ul className="divide-y divide-slate-100 border-t border-slate-100">
            {lista.map((item) => (
              <li
                key={item.id}
                className="grid grid-cols-1 items-center gap-3 bg-white px-4 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:px-5"
              >
                <div className="min-w-0 space-y-1">
                  <p className="text-sm text-slate-900">
                    {item.inicio}
                    {item.fim ? ` – ${item.fim}` : ''}
                  </p>
                  {item.comentario ? (
                    <p className="text-xs leading-relaxed text-slate-500">{item.comentario}</p>
                  ) : null}
                </div>
                <p className="text-center text-sm text-slate-800 sm:text-center">{item.tipo}</p>
                <div className="flex justify-end sm:min-w-[4.5rem]">
                  <button
                    type="button"
                    onClick={() => remover(item.id)}
                    className="inline-flex items-center gap-1 rounded-md p-2 text-sm font-medium text-danger-600 hover:bg-red-50"
                    aria-label="Remover afastamento"
                  >
                    <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : null}

        {rascunhoAberto ? (
          <div className="border border-slate-200 border-t-slate-100 bg-white px-4 py-4 sm:px-5">
            {erroRascunho ? (
              <p className="mb-3 text-sm text-red-600" role="alert">
                {erroRascunho}
              </p>
            ) : null}
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:gap-4">
              <div className="w-full shrink-0 sm:max-w-[11rem]">
                <label htmlFor="af-ras-inicio" className={labelAfast}>
                  Início<span className="text-red-600">*</span>
                </label>
                <input
                  id="af-ras-inicio"
                  type="text"
                  placeholder="dd/mm/aaaa"
                  value={rascunho.inicio}
                  onChange={(e) => setRascunho((r) => ({ ...r, inicio: e.target.value }))}
                  className={campoData}
                />
              </div>
              <div className="w-full shrink-0 sm:max-w-[11rem]">
                <label htmlFor="af-ras-fim" className={labelAfast}>
                  Fim
                </label>
                <input
                  id="af-ras-fim"
                  type="text"
                  placeholder="dd/mm/aaaa"
                  value={rascunho.fim}
                  onChange={(e) => setRascunho((r) => ({ ...r, fim: e.target.value }))}
                  className={campoData}
                />
              </div>
              <div className="w-full shrink-0 sm:max-w-[11rem]">
                <label htmlFor="af-ras-tipo" className={labelAfast}>
                  Tipo<span className="text-red-600">*</span>
                </label>
                <select
                  id="af-ras-tipo"
                  value={rascunho.tipo}
                  onChange={(e) =>
                    setRascunho((r) => ({
                      ...r,
                      tipo: e.target.value as (typeof TIPOS_AFASTAMENTO)[number],
                    }))
                  }
                  className={cn(campoData, 'cursor-pointer')}
                >
                  {TIPOS_AFASTAMENTO.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-w-0 flex-1">
                <label htmlFor="af-ras-coment" className={labelAfast}>
                  Comentário
                </label>
                <input
                  id="af-ras-coment"
                  type="text"
                  value={rascunho.comentario}
                  onChange={(e) => setRascunho((r) => ({ ...r, comentario: e.target.value }))}
                  className={campoData}
                />
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-4 border-t border-slate-100 pt-4 xl:border-t-0 xl:pt-0">
                <button
                  type="button"
                  onClick={fecharRascunho}
                  className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
                >
                  Cancelar
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-slate-50 text-slate-600"
                    aria-hidden
                  >
                    <X className="h-4 w-4" strokeWidth={2.5} />
                  </span>
                </button>
                <button
                  type="button"
                  onClick={confirmarRascunho}
                  className="inline-flex items-center gap-2 text-sm font-medium text-[#2563eb] transition-colors hover:text-[#1d4ed8]"
                >
                  Adicionar
                  <CheckCircle2
                    className="h-7 w-7 shrink-0 text-[#28a745]"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="border-t border-slate-100 p-3 sm:p-4">
          {!rascunhoAberto ? (
            <button
              type="button"
              onClick={abrirNovoRascunho}
              className="flex w-full items-center justify-center rounded-xl border-2 border-[#2563eb] bg-white py-14 px-6 text-sm font-medium text-[#2563eb] shadow-sm transition-colors hover:bg-blue-50/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
            >
              <span className="inline-flex items-center gap-2">
                <Plus className="h-5 w-5 shrink-0" aria-hidden />
                Adicionar
              </span>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function HabilidadesFormulario({
  form,
  setForm,
}: {
  form: FormInformacoes
  setForm: Dispatch<SetStateAction<FormInformacoes | null>>
}) {
  const [novaHabilidade, setNovaHabilidade] = useState('')

  function adicionar() {
    const t = novaHabilidade.trim()
    if (!t) return
    const dup = form.habilidades.some((h) => h.trim().toLowerCase() === t.toLowerCase())
    if (dup) {
      setNovaHabilidade('')
      return
    }
    setForm((prev) =>
      prev ? { ...prev, habilidades: [...prev.habilidades, t] } : prev,
    )
    setNovaHabilidade('')
  }

  function remover(index: number) {
    setForm((prev) =>
      prev
        ? {
            ...prev,
            habilidades: prev.habilidades.filter((_, i) => i !== index),
          }
        : prev,
    )
  }

  return (
    <div className="space-y-5">
      <p className="text-sm leading-relaxed text-slate-600">
        Cadastre as habilidades e competências relacionadas ao desempenho profissional.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="text"
          value={novaHabilidade}
          onChange={(e) => setNovaHabilidade(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), adicionar())}
          className={cn(inputEditavel, 'sm:max-w-md')}
          placeholder="Ex.: Ultrassom, UTI adulto..."
          aria-label="Nova habilidade"
        />
        <button
          type="button"
          onClick={adicionar}
          className="inline-flex w-fit shrink-0 items-center justify-center gap-2 rounded-md bg-[#2563eb] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#1d4ed8]"
        >
          <Plus className="h-4 w-4 shrink-0" aria-hidden />
          Adicionar
        </button>
      </div>
      {form.habilidades.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
          Nenhuma habilidade cadastrada.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {form.habilidades.map((habilidade, index) => (
            <li
              key={`${habilidade}-${index}`}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white pl-3 pr-1 py-1.5 text-sm text-slate-800"
            >
              <span className="max-w-[min(280px,calc(100vw-140px))] truncate">{habilidade}</span>
              <button
                type="button"
                onClick={() => remover(index)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-danger-600 hover:bg-red-50"
                aria-label={`Remover ${habilidade}`}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function AnexosFormulario({
  form,
  setForm,
}: {
  form: FormInformacoes
  setForm: Dispatch<SetStateAction<FormInformacoes | null>>
}) {
  function atualizarLinha<K extends keyof ProfissionalAnexo>(
    index: number,
    campo: K,
    valor: ProfissionalAnexo[K],
  ) {
    setForm((prev) => {
      if (!prev) return prev
      const copia = prev.anexos.map((row) => ({ ...row }))
      const linha = copia[index]
      if (!linha) return prev
      copia[index] = { ...linha, [campo]: valor }
      return { ...prev, anexos: copia }
    })
  }

  function adicionarLinha() {
    setForm((prev) =>
      prev
        ? {
            ...prev,
            anexos: [
              ...prev.anexos,
              { nome: '', tipo: 'Documento', enviadoEm: '' },
            ],
          }
        : prev,
    )
  }

  function removerLinha(index: number) {
    setForm((prev) =>
      prev
        ? { ...prev, anexos: prev.anexos.filter((_, i) => i !== index) }
        : prev,
    )
  }

  return (
    <div className="space-y-5">
      <p className="text-sm leading-relaxed text-slate-600">
        Registre anexos e documentos relacionados ao profissional. O envio de arquivos para o
        armazenamento em nuvem pode ser configurado depois — por ora os metadados são salvos no
        perfil.
      </p>
      {form.anexos.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
          Nenhum anexo registrado.
        </p>
      ) : (
        <ul className="space-y-3">
          {form.anexos.map((anexo, index) => (
            <li
              key={`anexo-${index}`}
              className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-4"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_minmax(0,0.65fr)_8rem_auto]">
                <div className="min-w-0">
                  <FormLabel htmlFor={`anexo-nome-${index}`}>Descrição ou nome</FormLabel>
                  <input
                    id={`anexo-nome-${index}`}
                    type="text"
                    value={anexo.nome}
                    onChange={(e) => atualizarLinha(index, 'nome', e.target.value)}
                    className={inputEditavel}
                    placeholder="Ex.: Diploma, CRM..."
                  />
                </div>
                <div className="min-w-0">
                  <FormLabel htmlFor={`anexo-tipo-${index}`}>Tipo</FormLabel>
                  <input
                    id={`anexo-tipo-${index}`}
                    type="text"
                    value={anexo.tipo}
                    onChange={(e) => atualizarLinha(index, 'tipo', e.target.value)}
                    className={inputEditavel}
                  />
                </div>
                <div>
                  <FormLabel htmlFor={`anexo-data-${index}`}>Referência ou data</FormLabel>
                  <input
                    id={`anexo-data-${index}`}
                    type="text"
                    autoComplete="off"
                    value={anexo.enviadoEm}
                    onChange={(e) => atualizarLinha(index, 'enviadoEm', e.target.value)}
                    className={inputEditavel}
                    placeholder="aaaa-mm-dd"
                  />
                </div>
                <div className="flex items-end justify-end pb-1">
                  <button
                    type="button"
                    onClick={() => removerLinha(index)}
                    className="inline-flex rounded-md p-2 text-danger-600 hover:bg-red-50"
                    aria-label="Remover anexo"
                  >
                    <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        onClick={adicionarLinha}
        className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#2563eb]/60 bg-blue-50/40 py-4 text-sm font-medium text-[#2563eb] hover:bg-blue-50"
      >
        <Plus className="h-4 w-4 shrink-0" aria-hidden />
        Adicionar registro de anexo
      </button>
    </div>
  )
}

function EnderecoFormulario({
  form,
  setForm,
}: {
  form: FormInformacoes
  setForm: Dispatch<SetStateAction<FormInformacoes | null>>
}) {
  const cidadeListId = useId()

  function patch<K extends keyof FormInformacoes>(
    campo: K,
    valor: FormInformacoes[K],
  ) {
    setForm((prev) => (prev === null ? prev : { ...prev, [campo]: valor }))
  }

  const cidadesSugestao = useMemo(
    () => cidadesSugeridasParaUf(form.enderecoUf),
    [form.enderecoUf],
  )

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-primary-200 bg-primary-50 px-4 py-3 text-sm leading-relaxed text-primary-950">
        <strong className="font-semibold">Novidade!</strong> Agora você encontra as
        informações relacionadas ao endereço do profissional nesta aba.
      </div>

      <h2 className="text-lg font-bold tracking-tight text-slate-900">Endereço</h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-x-4">
        <div className="md:col-span-3 lg:col-span-2">
          <FormLabel htmlFor="pf-end-cep">CEP</FormLabel>
          <input
            id="pf-end-cep"
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            value={form.enderecoCep}
            onChange={(e) => patch('enderecoCep', e.target.value)}
            className={inputEditavel}
            placeholder="00000-000"
          />
        </div>
        <div className="md:col-span-6 lg:col-span-7">
          <FormLabel htmlFor="pf-end-rua">Rua</FormLabel>
          <input
            id="pf-end-rua"
            type="text"
            autoComplete="street-address"
            value={form.enderecoRua}
            onChange={(e) => patch('enderecoRua', e.target.value)}
            className={inputEditavel}
          />
        </div>
        <div className="md:col-span-3 lg:col-span-3">
          <FormLabel htmlFor="pf-end-num">Número</FormLabel>
          <input
            id="pf-end-num"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={form.enderecoNumero}
            onChange={(e) => patch('enderecoNumero', e.target.value)}
            className={inputEditavel}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-x-4">
        <div>
          <FormLabel htmlFor="pf-end-bairro">Bairro</FormLabel>
          <input
            id="pf-end-bairro"
            type="text"
            value={form.enderecoBairro}
            onChange={(e) => patch('enderecoBairro', e.target.value)}
            className={inputEditavel}
          />
        </div>
        <div>
          <FormLabel htmlFor="pf-end-comp">Complemento</FormLabel>
          <input
            id="pf-end-comp"
            type="text"
            value={form.enderecoComplemento}
            onChange={(e) => patch('enderecoComplemento', e.target.value)}
            className={inputEditavel}
            placeholder="Apartamento, bloco..."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-x-4 lg:max-w-3xl">
        <div className="sm:max-w-40">
          <FormLabel htmlFor="pf-end-uf">
            UF{' '}
            <span className="font-semibold text-danger-600" aria-hidden>
              *
            </span>
          </FormLabel>
          <select
            id="pf-end-uf"
            required
            value={form.enderecoUf}
            onChange={(e) => patch('enderecoUf', e.target.value)}
            className={cn(inputEditavel, 'cursor-pointer')}
          >
            {UFS_BR.map((uf) => (
              <option key={uf} value={uf}>
                {uf}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-0 flex-1">
          <FormLabel htmlFor="pf-end-cidade">
            Cidade{' '}
            <span className="font-semibold text-danger-600" aria-hidden>
              *
            </span>
          </FormLabel>
          <input
            id="pf-end-cidade"
            type="text"
            list={cidadeListId}
            required
            autoComplete="address-level2"
            value={form.enderecoCidade}
            onChange={(e) => patch('enderecoCidade', e.target.value)}
            className={inputEditavel}
            placeholder="Ex.: Belém"
          />
          <datalist id={cidadeListId}>
            {cidadesSugestao.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
      </div>
    </div>
  )
}

function filtrarArvoreGrupos(
  arvore: LocalComSetoresArvore[],
  busca: string,
  apenasSelecionados: boolean,
  selecionados: Set<string>,
): LocalComSetoresArvore[] {
  const q = busca.trim().toLowerCase()
  return arvore
    .map((local) => {
      const localMatch = q === '' || local.nome.toLowerCase().includes(q)
      const setores = local.setores.filter((s) => {
        if (apenasSelecionados && !selecionados.has(s.id)) return false
        if (q === '') return true
        if (localMatch) return true
        return s.nome.toLowerCase().includes(q)
      })
      return { ...local, setores }
    })
    .filter((local) => local.setores.length > 0)
}

function contarSetoresArvore(arvore: LocalComSetoresArvore[]) {
  return arvore.reduce((acc, l) => acc + l.setores.length, 0)
}

function GruposFormulario({
  form,
  setForm,
  locaisComSetoresArvore,
}: {
  form: FormInformacoes
  setForm: Dispatch<SetStateAction<FormInformacoes | null>>
  locaisComSetoresArvore: LocalComSetoresArvore[]
}) {
  const [busca, setBusca] = useState('')
  const [apenasSelecionados, setApenasSelecionados] = useState(false)

  const selecionados = useMemo(
    () => new Set(form.setoresVinculadosIds),
    [form.setoresVinculadosIds],
  )

  const arvoreFiltrada = useMemo(
    () =>
      filtrarArvoreGrupos(
        locaisComSetoresArvore,
        busca,
        apenasSelecionados,
        selecionados,
      ),
    [locaisComSetoresArvore, busca, apenasSelecionados, selecionados],
  )

  const totalCatalogo = useMemo(
    () => contarSetoresArvore(locaisComSetoresArvore),
    [locaisComSetoresArvore],
  )
  const totalVisiveis = useMemo(
    () => contarSetoresArvore(arvoreFiltrada),
    [arvoreFiltrada],
  )

  function toggleSetor(setorId: string) {
    setForm((prev) => {
      if (!prev) return prev
      const s = new Set(prev.setoresVinculadosIds)
      if (s.has(setorId)) s.delete(setorId)
      else s.add(setorId)
      return { ...prev, setoresVinculadosIds: Array.from(s) }
    })
  }

  function toggleLocal(localId: string) {
    const local = locaisComSetoresArvore.find((l) => l.id === localId)
    if (!local || local.setores.length === 0) return
    setForm((prev) => {
      if (!prev) return prev
      const s = new Set(prev.setoresVinculadosIds)
      const ids = local.setores.map((x) => x.id)
      const allOn = ids.every((id) => s.has(id))
      if (allOn) ids.forEach((id) => s.delete(id))
      else ids.forEach((id) => s.add(id))
      return { ...prev, setoresVinculadosIds: Array.from(s) }
    })
  }

  function estadoLocal(local: LocalComSetoresArvore) {
    if (local.setores.length === 0) return { checked: false, indet: false }
    const n = local.setores.filter((x) => selecionados.has(x.id)).length
    if (n === 0) return { checked: false, indet: false }
    if (n === local.setores.length) return { checked: true, indet: false }
    return { checked: false, indet: true }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <p className="max-w-xl text-sm text-slate-600">
          Selecione os locais, setores e grupos ao qual o usuário irá pertencer.
        </p>
        <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={apenasSelecionados}
            onChange={(e) => setApenasSelecionados(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
          />
          <span>Exibir apenas grupos selecionados</span>
        </label>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            type="search"
            placeholder="Pesquisar local, setor ou grupo"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className={cn(
              inputEditavel,
              'w-full pl-9',
            )}
            autoComplete="off"
          />
        </div>
        <p className="shrink-0 text-sm tabular-nums text-slate-500">
          Exibindo {totalVisiveis} de {totalCatalogo}.
        </p>
      </div>

      {locaisComSetoresArvore.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
          Cadastre locais e setores em <strong>Configurações</strong> para vincular
          este profissional.
        </p>
      ) : arvoreFiltrada.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
          Nenhum local ou setor encontrado para os filtros atuais.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
          <ul className="divide-y divide-slate-200/80">
            {arvoreFiltrada.map((localLinha) => {
              const localFull =
                locaisComSetoresArvore.find((l) => l.id === localLinha.id) ??
                localLinha
              const { checked, indet } = estadoLocal(localFull)

              return (
                <li key={localLinha.id} className="bg-slate-50">
                  <div className="flex items-center gap-3 bg-slate-200/80 px-3 py-2.5 sm:px-4">
                    <input
                      type="checkbox"
                      checked={checked}
                      ref={(el) => {
                        if (el) el.indeterminate = indet
                      }}
                      onChange={() => toggleLocal(localLinha.id)}
                      className="h-4 w-4 shrink-0 rounded border-slate-400 text-primary focus:ring-primary"
                      aria-label={`Selecionar todos os setores de ${localLinha.nome}`}
                    />
                    <span className="min-w-0 flex-1 text-sm font-bold uppercase tracking-tight text-slate-900">
                      {localLinha.nome}
                    </span>
                    <span className="shrink-0 rounded-md bg-amber-300 px-2 py-0.5 text-xs font-semibold text-amber-950">
                      Local
                    </span>
                  </div>
                  <ul className="bg-white">
                    {localLinha.setores.map((setItem) => (
                      <li
                        key={setItem.id}
                        className="flex items-center gap-3 border-t border-slate-100 py-2.5 pl-8 pr-3 sm:pl-10 sm:pr-4"
                      >
                        <input
                          type="checkbox"
                          checked={selecionados.has(setItem.id)}
                          onChange={() => toggleSetor(setItem.id)}
                          className="h-4 w-4 shrink-0 rounded border-slate-300 text-primary focus:ring-primary"
                          aria-label={`Setor ${setItem.nome}`}
                        />
                        <span className="min-w-0 flex-1 text-sm font-normal text-slate-800">
                          {setItem.nome}
                        </span>
                        <span className="shrink-0 rounded-md bg-sky-200 px-2 py-0.5 text-xs font-semibold text-sky-950">
                          Setor
                        </span>
                      </li>
                    ))}
                  </ul>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

function InformacoesFormulario({
  form,
  setForm,
  setores,
  locaisOpcoes,
}: {
  form: FormInformacoes
  setForm: Dispatch<SetStateAction<FormInformacoes | null>>
  setores: string[]
  locaisOpcoes: LocalOpcaoModal[]
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
          <select
            id="pf-local"
            value={form.localId}
            onChange={(e) => patch('localId', e.target.value)}
            className={cn(inputEditavel, 'cursor-pointer')}
          >
            <option value="">Selecione um local</option>
            {form.localId &&
            !locaisOpcoes.some((l) => l.id === form.localId) ? (
              <option value={form.localId}>
                Local anterior (não está na lista)
              </option>
            ) : null}
            {locaisOpcoes.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nome}
              </option>
            ))}
          </select>
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
  locaisOpcoes,
  locaisComSetoresArvore,
  onClose,
  onSave,
  onDelete,
}: ProfissionalDetalhesModalProps) {
  const [aba, setAba] = useState<AbaPerfil>('informacoes')
  const [salvando, setSalvando] = useState(false)
  const [formInformacoes, setFormInformacoes] = useState<FormInformacoes | null>(
    null,
  )
  const [saveError, setSaveError] = useState<string | null>(null)
  const [recuperacaoAuth, setRecuperacaoAuth] = useState<{
    tipo: 'ok' | 'erro'
    mensagem: string
  } | null>(null)
  const [recuperandoSenha, setRecuperandoSenha] = useState(false)
  const { isTitular } = useContaMembro()

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

  useEffect(() => {
    if (open) {
      setSaveError(null)
      setRecuperacaoAuth(null)
    }
  }, [open, profissional?.id])

  async function aoRecuperarSenha() {
    setSaveError(null)
    setRecuperacaoAuth(null)
    const email = formInformacoes?.email.trim()
    if (!email) {
      setSaveError(
        'Informe o e-mail do profissional (aba Informações) para enviar o link de redefinição.',
      )
      setAba('informacoes')
      return
    }
    const origemSite =
      (typeof import.meta.env.VITE_PUBLIC_SITE_URL === 'string' &&
        import.meta.env.VITE_PUBLIC_SITE_URL.trim()) ||
      (typeof window !== 'undefined' ? window.location.origin : '')
    const redirectTo = `${origemSite.replace(/\/$/, '')}/login`
    setRecuperandoSenha(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })
    setRecuperandoSenha(false)
    if (error) {
      setRecuperacaoAuth({
        tipo: 'erro',
        mensagem: error.message || 'Não foi possível enviar o e-mail de recuperação.',
      })
      return
    }
    setRecuperacaoAuth({
      tipo: 'ok',
      mensagem:
        'Se existir conta com esse e-mail no projeto, será enviada uma mensagem com o link para redefinir a senha.',
    })
  }

  if (!open || !profissional) return null

  const profissionalAtual = profissional
  const { detalhes: d } = profissionalAtual

  async function aoSalvar() {
    if (!formInformacoes) return
    setSaveError(null)
    setRecuperacaoAuth(null)
    if (!formInformacoes.enderecoUf.trim()) {
      setSaveError('Preencha a UF do endereço (aba Endereço).')
      setAba('endereco')
      return
    }
    if (!formInformacoes.enderecoCidade.trim()) {
      setSaveError('Preencha a cidade do endereço (aba Endereço).')
      setAba('endereco')
      return
    }
    if (onSave) {
      setSalvando(true)
      const { error } = await onSave(profissionalAtual.id, formInformacoes)
      setSalvando(false)
      if (error) {
        setSaveError(error)
        return
      }
      onClose()
      return
    }
    setSalvando(true)
    window.setTimeout(() => setSalvando(false), 1200)
  }

  async function aoRemover() {
    if (!onDelete) return
    if (
      !window.confirm(
        'Remover este profissional? Os vínculos com setores também serão excluídos. Esta ação não pode ser desfeita.',
      )
    ) {
      return
    }
    setSaveError(null)
    setSalvando(true)
    const { error } = await onDelete(profissionalAtual.id)
    setSalvando(false)
    if (error) {
      setSaveError(error)
      return
    }
    onClose()
  }

  let conteudo: ReactNode
  switch (aba) {
    case 'informacoes':
      conteudo =
        formInformacoes ? (
          <InformacoesFormulario
            form={formInformacoes}
            setForm={setFormInformacoes}
            setores={profissionalAtual.setores}
            locaisOpcoes={locaisOpcoes}
          />
        ) : null
      break
    case 'endereco':
      conteudo =
        formInformacoes ? (
          <EnderecoFormulario
            form={formInformacoes}
            setForm={setFormInformacoes}
          />
        ) : null
      break
    case 'grupos':
      conteudo =
        formInformacoes ? (
          <GruposFormulario
            form={formInformacoes}
            setForm={setFormInformacoes}
            locaisComSetoresArvore={locaisComSetoresArvore}
          />
        ) : null
      break
    case 'dados-bancarios':
      conteudo =
        formInformacoes ? (
          <DadosBancariosAba
            detalhes={d}
            form={formInformacoes}
            setForm={setFormInformacoes}
          />
        ) : null
      break
    case 'faturamento':
      conteudo =
        formInformacoes ? (
          <FaturamentoFormulario
            form={formInformacoes}
            setForm={setFormInformacoes}
          />
        ) : null
      break
    case 'contratacao':
      conteudo =
        formInformacoes ? (
          <ContratacaoFormulario
            form={formInformacoes}
            setForm={setFormInformacoes}
          />
        ) : null
      break
    case 'afastamentos':
      conteudo =
        formInformacoes ? (
          <AfastamentosFormulario
            form={formInformacoes}
            setForm={setFormInformacoes}
          />
        ) : null
      break
    case 'habilidades':
      conteudo =
        formInformacoes ? (
          <HabilidadesFormulario form={formInformacoes} setForm={setFormInformacoes} />
        ) : null
      break
    case 'anexos':
      conteudo =
        formInformacoes ? (
          <AnexosFormulario form={formInformacoes} setForm={setFormInformacoes} />
        ) : null
      break
    case 'documentos':
      conteudo = (
        <DocumentosProfissionalPanel
          profissionalId={profissionalAtual.id}
          siglaConselho={profissionalAtual.detalhes.siglaConselho ?? d.siglaConselho}
          podeValidar={isTitular}
        />
      )
      break
    default:
      conteudo = null
  }

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 sm:p-6">
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
                    {iniciaisNome(profissionalAtual.nome)}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h2
                  id="profissional-modal-title"
                  className="truncate text-base font-semibold text-[#2563eb] lg:text-lg"
                >
                  {profissionalAtual.nome}
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
            {saveError ? (
              <p
                className="w-full rounded-md border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-800 sm:w-auto"
                role="alert"
              >
                {saveError}
              </p>
            ) : null}
            {recuperacaoAuth ? (
              <p
                role="status"
                className={
                  recuperacaoAuth.tipo === 'ok'
                    ? 'w-full rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900 sm:w-auto'
                    : 'w-full rounded-md border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-800 sm:w-auto'
                }
              >
                {recuperacaoAuth.mensagem}
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => void aoRecuperarSenha()}
              disabled={salvando || recuperandoSenha}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="inline-flex shrink-0 items-center gap-0.5 text-slate-600" aria-hidden>
                <Mail className="h-4 w-4" />
                <ArrowRight className="h-3 w-3 opacity-80" />
              </span>
              {recuperandoSenha ? (
                <>
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                  Enviando...
                </>
              ) : (
                'Recuperar Senha'
              )}
            </button>
            <button
              type="button"
              onClick={aoRemover}
              disabled={salvando || !onDelete}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-danger-600 bg-white px-3 text-sm font-medium text-danger-600 shadow-sm hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
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
