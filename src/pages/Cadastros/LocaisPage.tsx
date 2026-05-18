import {
  Building2,
  Edit3,
  ChevronDown,
  Loader2,
  MapPin,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { cn } from '../../lib/cn'
import { useSupabaseUser } from '../../hooks/useSupabaseUser'
import { supabase } from '../../lib/supabase'

type LocalCadastro = {
  id: string
  codigo: string
  ativo: boolean
  nomeFantasia: string
  razaoSocial: string
  cnpj: string
  telefone: string
  cep: string
  rua: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  uf: string
  anotacoes: string
  fusoHorario: string
  latitude: string
  longitude: string
  setores: number
}

type SetorLocal = {
  id: string
  localId: string
  codigo: string
  nome: string
  ativo: boolean
}

type LinhaSetorSupabase = {
  id: string
  local_id: string
  codigo: string
  nome: string
  ativo: boolean
}

function agruparSetoresPorLocal(setoresData: LinhaSetorSupabase[]): Record<string, SetorLocal[]> {
  return setoresData.reduce<Record<string, SetorLocal[]>>((acc, setor) => {
    const localId = setor.local_id
    if (!acc[localId]) acc[localId] = []
    acc[localId].push({
      id: setor.id,
      localId,
      codigo: setor.codigo,
      nome: setor.nome,
      ativo: setor.ativo,
    })
    return acc
  }, {})
}

type ContextoModalSetor =
  | null
  | { tipo: 'novo'; localId: string }
  | { tipo: 'editar'; localId: string; setor: SetorLocal }

type LocalFormulario = {
  codigo: string
  nomeFantasia: string
  cep: string
  rua: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  uf: string
  razaoSocial: string
  cnpj: string
  anotacoes: string
  fusoHorario: string
  latitude: string
  longitude: string
}

const UFS_SELECT = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE',
  'TO',
] as const

function localParaFormulario(local: LocalCadastro | null): LocalFormulario {
  if (!local) {
    return {
      codigo: '',
      nomeFantasia: '',
      cep: '',
      rua: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      uf: 'PA',
      razaoSocial: '',
      cnpj: '',
      anotacoes: '',
      fusoHorario: '(UTC-03:00) Brasília',
      latitude: '',
      longitude: '',
    }
  }
  return {
    codigo: local.codigo,
    nomeFantasia: local.nomeFantasia,
    cep: local.cep,
    rua: local.rua,
    numero: local.numero,
    complemento: local.complemento,
    bairro: local.bairro,
    cidade: local.cidade,
    uf: local.uf,
    razaoSocial: local.razaoSocial,
    cnpj: local.cnpj,
    anotacoes: local.anotacoes,
    fusoHorario: local.fusoHorario,
    latitude: local.latitude,
    longitude: local.longitude,
  }
}

function gerarCodigoLocalProvisorio() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `LOC-${crypto.randomUUID().replace(/-/g, '').slice(0, 10)}`
  }
  return `LOC-${Date.now().toString(36)}`
}

function gerarCodigoSetorProvisorio() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `S_${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`
  }
  return `S_${Date.now().toString(36)}`
}

const inputClassName =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100'

type LocalModalProps = {
  aberto: boolean
  local: LocalCadastro | null
  userId: string | null
  onFechar: () => void
  onSalvo: () => void
}

function LocalModal({
  aberto,
  local,
  userId,
  onFechar,
  onSalvo,
}: LocalModalProps) {
  const [form, setForm] = useState<LocalFormulario>(() => localParaFormulario(local))
  const [salvando, setSalvando] = useState(false)
  const [erroSalvar, setErroSalvar] = useState<string | null>(null)

  useEffect(() => {
    if (!aberto) return
    setForm(localParaFormulario(local))
    setErroSalvar(null)
  }, [aberto, local])

  if (!aberto) return null

  const tituloCabecalho =
    form.nomeFantasia.trim() || local?.nomeFantasia || 'Novo Local'
  const subtitulo = local ? 'ALTERAR LOCAL' : 'NOVO LOCAL'

  function patch<K extends keyof LocalFormulario>(campo: K, valor: LocalFormulario[K]) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  async function salvar() {
    if (!userId) {
      setErroSalvar('Sessão inválida. Faça login novamente.')
      return
    }

    const nome = form.nomeFantasia.trim()
    const rua = form.rua.trim()
    const numero = form.numero.trim()
    const bairro = form.bairro.trim()
    const cidade = form.cidade.trim()
    const uf = form.uf.trim().toUpperCase().slice(0, 2)

    if (!nome) {
      setErroSalvar('Preencha o nome do local.')
      return
    }
    if (!rua || !numero || !bairro || !cidade || uf.length !== 2) {
      setErroSalvar('Preencha rua, número, bairro, cidade e UF (2 letras).')
      return
    }

    const codigoFinal = form.codigo.trim() || gerarCodigoLocalProvisorio()

    const agora = new Date().toISOString()
    const corpo = {
      codigo: codigoFinal,
      nome_fantasia: nome,
      razao_social: form.razaoSocial.trim() || null,
      cnpj: form.cnpj.trim() || null,
      telefone: null as string | null,
      cep: form.cep.trim() || null,
      rua,
      numero,
      complemento: form.complemento.trim() || null,
      bairro,
      cidade,
      uf,
      anotacoes: form.anotacoes.trim() || null,
      fuso_horario: form.fusoHorario.trim() || null,
      latitude: form.latitude.trim() || null,
      longitude: form.longitude.trim() || null,
      updated_at: agora,
    }

    setSalvando(true)
    setErroSalvar(null)

    try {
      if (local) {
        const { error } = await supabase
          .from('locais')
          .update({
            ...corpo,
            ativo: local.ativo,
          })
          .eq('id', local.id)
          .eq('user_id', userId)
        if (error) {
          setErroSalvar(error.message)
          return
        }
      } else {
        const { error } = await supabase.from('locais').insert({
          user_id: userId,
          ativo: true,
          ...corpo,
        })
        if (error) {
          setErroSalvar(error.message)
          return
        }
      }
      onSalvo()
      onFechar()
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
        aria-label="Fechar modal"
        onClick={onFechar}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="local-modal-title"
        className="absolute inset-4 flex flex-col overflow-hidden rounded-lg bg-white shadow-2xl ring-1 ring-slate-200 md:inset-6 lg:inset-x-[6%] lg:inset-y-[5%]"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 md:px-6">
          <div className="min-w-0">
            <h2
              id="local-modal-title"
              className="truncate text-xl font-medium uppercase tracking-tight text-slate-700"
            >
              {tituloCabecalho}
            </h2>
            <p className="text-xs uppercase tracking-wide text-slate-500">{subtitulo}</p>
          </div>
          <button
            type="button"
            onClick={onFechar}
            className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </header>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(e) => {
            e.preventDefault()
            void salvar()
          }}
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 md:px-6">
            {erroSalvar ? (
              <div
                className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                role="alert"
              >
                {erroSalvar}
              </div>
            ) : null}
            <div className="grid gap-5">
              <div className="grid gap-4 md:grid-cols-[1fr_2fr_1fr]">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-600">
                    Código
                  </label>
                  <input
                    type="text"
                    className={inputClassName}
                    value={form.codigo}
                    onChange={(e) => patch('codigo', e.target.value)}
                    placeholder="Gerado automaticamente se vazio"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-600">
                    Nome *
                  </label>
                  <input
                    type="text"
                    className={inputClassName}
                    value={form.nomeFantasia}
                    onChange={(e) => patch('nomeFantasia', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-600">
                    CEP
                  </label>
                  <input
                    type="text"
                    className={inputClassName}
                    value={form.cep}
                    onChange={(e) => patch('cep', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[2fr_1fr_1fr]">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-600">
                    Rua *
                  </label>
                  <input
                    type="text"
                    className={inputClassName}
                    value={form.rua}
                    onChange={(e) => patch('rua', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-600">
                    Nº *
                  </label>
                  <input
                    type="text"
                    className={inputClassName}
                    value={form.numero}
                    onChange={(e) => patch('numero', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-600">
                    Compl.
                  </label>
                  <input
                    type="text"
                    className={inputClassName}
                    value={form.complemento}
                    onChange={(e) => patch('complemento', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[1.5fr_0.8fr_1.2fr]">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-600">
                    Bairro *
                  </label>
                  <input
                    type="text"
                    className={inputClassName}
                    value={form.bairro}
                    onChange={(e) => patch('bairro', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-600">
                    UF *
                  </label>
                  <select
                    className={inputClassName}
                    value={form.uf}
                    onChange={(e) => patch('uf', e.target.value)}
                    required
                  >
                    {UFS_SELECT.map((uf) => (
                      <option key={uf} value={uf}>
                        {uf}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-600">
                    Cidade *
                  </label>
                  <input
                    type="text"
                    className={inputClassName}
                    value={form.cidade}
                    onChange={(e) => patch('cidade', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-600">
                    Razão Social
                  </label>
                  <input
                    type="text"
                    className={inputClassName}
                    value={form.razaoSocial}
                    onChange={(e) => patch('razaoSocial', e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-600">
                    CNPJ
                  </label>
                  <input
                    type="text"
                    className={inputClassName}
                    value={form.cnpj}
                    onChange={(e) => patch('cnpj', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-600">
                    Anotações
                  </label>
                  <textarea
                    className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                    value={form.anotacoes}
                    onChange={(e) => patch('anotacoes', e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-600">
                    Fuso horário
                  </label>
                  <select
                    className={inputClassName}
                    value={form.fusoHorario}
                    onChange={(e) => patch('fusoHorario', e.target.value)}
                  >
                    <option value="(UTC-04:00) Manaus">(UTC-04:00) Manaus</option>
                    <option value="(UTC-03:00) Brasília">(UTC-03:00) Brasília</option>
                    <option value="(UTC-02:00) Fernando de Noronha">
                      (UTC-02:00) Fernando de Noronha
                    </option>
                  </select>
                </div>
              </div>

              <section className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4">
                <h3 className="text-base font-semibold text-slate-700">
                  Adicione as coordenadas deste local
                </h3>
                <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr_auto]">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-600">
                      Latitude
                    </label>
                    <input
                      type="text"
                      className={inputClassName}
                      value={form.latitude}
                      onChange={(e) => patch('latitude', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-600">
                      Longitude
                    </label>
                    <input
                      type="text"
                      className={inputClassName}
                      value={form.longitude}
                      onChange={(e) => patch('longitude', e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-primary-400 bg-white px-4 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50"
                    >
                      <MapPin className="h-4 w-4" aria-hidden />
                      Ir para Coordenadas
                    </button>
                  </div>
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  Para obter as coordenadas, basta acessar o Google Maps e localizar a unidade de saúde.
                </p>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs text-slate-500">
                  <li>Clique com o botão direito do mouse no mapa sobre a unidade.</li>
                  <li>Clique na primeira opção (Coordenadas) e copie os valores.</li>
                  <li>Em seguida, cole os valores nos campos acima.</li>
                </ol>
              </section>

              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-800">Logotipo do local</h3>
                <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center transition-colors hover:border-primary-300 hover:bg-primary-50/50">
                  <Upload className="h-7 w-7 text-slate-400" aria-hidden />
                  <span className="mt-3 text-sm font-medium text-slate-700">
                    Clique para enviar o logotipo
                  </span>
                  <span className="mt-1 text-xs text-slate-500">
                    PNG, JPG ou SVG. Campo visual apenas por enquanto.
                  </span>
                  <input type="file" className="sr-only" accept="image/*" />
                </label>
              </section>
            </div>
          </div>

          <footer className="shrink-0 border-t border-slate-200 bg-white px-5 py-4 md:px-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary-400 bg-white px-4 py-2.5 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50"
                >
                  <MapPin className="h-4 w-4" aria-hidden />
                  Ir para o Maps
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary-400 bg-white px-4 py-2.5 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50"
                >
                  <ShieldAlert className="h-4 w-4" aria-hidden />
                  Ir para Central de Ajuda
                </button>
              </div>
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={onFechar}
                  disabled={salvando}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 disabled:opacity-50"
                >
                  {salvando ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      Salvando…
                    </>
                  ) : (
                    'Salvar'
                  )}
                </button>
              </div>
            </div>
          </footer>
        </form>
      </div>
    </div>
  )
}

type SetorFormModalProps = {
  contexto: ContextoModalSetor
  userId: string | null
  onFechar: () => void
  onSalvo: () => void
}

function SetorFormModal({ contexto, userId, onFechar, onSalvo }: SetorFormModalProps) {
  const [codigo, setCodigo] = useState('')
  const [nome, setNome] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!contexto) return
    if (contexto.tipo === 'editar') {
      setCodigo(contexto.setor.codigo)
      setNome(contexto.setor.nome)
    } else {
      setCodigo('')
      setNome('Novo setor')
    }
    setErro(null)
  }, [contexto])

  if (!contexto) return null

  const titulo =
    contexto.tipo === 'editar' ? 'Editar setor' : 'Novo setor'

  async function salvar() {
    if (!userId) {
      setErro('Sessão inválida. Faça login novamente.')
      return
    }
    const nomeLimpo = nome.trim()
    if (!nomeLimpo) {
      setErro('Informe o nome do setor.')
      return
    }
    const codigoFinal = codigo.trim() || gerarCodigoSetorProvisorio()
    const agora = new Date().toISOString()

    setSalvando(true)
    setErro(null)
    try {
      if (contexto.tipo === 'novo') {
        const { error: errInsert } = await supabase.from('setores').insert({
          user_id: userId,
          local_id: contexto.localId,
          codigo: codigoFinal,
          nome: nomeLimpo,
          ativo: true,
          updated_at: agora,
        })
        if (errInsert) {
          setErro(errInsert.message)
          return
        }
      } else {
        const { error: errUpdate } = await supabase
          .from('setores')
          .update({
            codigo: codigoFinal,
            nome: nomeLimpo,
            updated_at: agora,
          })
          .eq('id', contexto.setor.id)
          .eq('user_id', userId)
          .eq('local_id', contexto.localId)
        if (errUpdate) {
          setErro(errUpdate.message)
          return
        }
      }
      onSalvo()
      onFechar()
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
        aria-label="Fechar modal de setor"
        onClick={onFechar}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="setor-modal-titulo"
        className="relative w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-slate-200"
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 id="setor-modal-titulo" className="text-lg font-semibold text-slate-900">
            {titulo}
          </h2>
          <button
            type="button"
            onClick={onFechar}
            disabled={salvando}
            className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </header>
        <form
          className="px-5 py-4"
          onSubmit={(e) => {
            e.preventDefault()
            void salvar()
          }}
        >
          {erro ? (
            <div
              className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
              role="alert"
            >
              {erro}
            </div>
          ) : null}
          <div className="space-y-4">
            <div>
              <label htmlFor="setor-codigo" className="mb-1.5 block text-sm font-medium text-slate-600">
                Código
              </label>
              <input
                id="setor-codigo"
                type="text"
                className={inputClassName}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Gerado automaticamente se vazio"
                disabled={salvando}
              />
            </div>
            <div>
              <label htmlFor="setor-nome" className="mb-1.5 block text-sm font-medium text-slate-600">
                Nome *
              </label>
              <input
                id="setor-nome"
                type="text"
                className={inputClassName}
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                disabled={salvando}
              />
            </div>
          </div>
          <footer className="mt-6 flex justify-end gap-2 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onFechar}
              disabled={salvando}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-50"
            >
              {salvando ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Salvando…
                </>
              ) : (
                'Salvar'
              )}
            </button>
          </footer>
        </form>
      </div>
    </div>
  )
}

export function LocaisPage() {
  const { user, isLoading: isLoadingUser } = useSupabaseUser()
  const [busca, setBusca] = useState('')
  const [modalLocalAberto, setModalLocalAberto] = useState(false)
  const [localSelecionado, setLocalSelecionado] = useState<LocalCadastro | null>(
    null,
  )
  const [localExpandidoId, setLocalExpandidoId] = useState<string | null>(null)
  const [locais, setLocais] = useState<LocalCadastro[]>([])
  const [setoresPorLocal, setSetoresPorLocal] = useState<Record<string, SetorLocal[]>>(
    {},
  )
  const [isLoading, setIsLoading] = useState(true)
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null)
  const sequenciaCarregamentoRef = useRef(0)
  const [contextoModalSetor, setContextoModalSetor] = useState<ContextoModalSetor>(null)
  const [setorEmOperacaoId, setSetorEmOperacaoId] = useState<string | null>(null)

  const carregarLocais = useCallback(async () => {
    if (isLoadingUser) return

    const userId = user?.id
    if (!userId) {
      setLocais([])
      setSetoresPorLocal({})
      setErroCarregamento(null)
      setIsLoading(false)
      return
    }

    const seq = ++sequenciaCarregamentoRef.current
    setIsLoading(true)
    setErroCarregamento(null)

    const [locaisResponse, setoresResponse] = await Promise.all([
      supabase
        .from('locais')
        .select(
          'id, codigo, ativo, nome_fantasia, razao_social, cnpj, telefone, cep, rua, numero, complemento, bairro, cidade, uf, anotacoes, fuso_horario, latitude, longitude',
        )
        .eq('user_id', userId)
        .order('nome_fantasia', { ascending: true }),
      supabase
        .from('setores')
        .select('id, local_id, codigo, nome, ativo')
        .eq('user_id', userId)
        .order('codigo', { ascending: true }),
    ])

    if (seq !== sequenciaCarregamentoRef.current) return

    const locaisData = locaisResponse.data ?? []
    const setoresData = setoresResponse.data ?? []

    if (locaisResponse.error || setoresResponse.error) {
      setLocais([])
      setSetoresPorLocal({})
      setErroCarregamento(
        locaisResponse.error?.message ??
          setoresResponse.error?.message ??
          'Não foi possível carregar os locais.',
      )
      setIsLoading(false)
      return
    }

    const setoresAgrupados = agruparSetoresPorLocal(setoresData as LinhaSetorSupabase[])

    const locaisNormalizados: LocalCadastro[] = locaisData.map((local) => ({
      id: local.id,
      codigo: local.codigo,
      ativo: local.ativo,
      nomeFantasia: local.nome_fantasia,
      razaoSocial: local.razao_social ?? '',
      cnpj: local.cnpj ?? '',
      telefone: local.telefone ?? '',
      cep: local.cep ?? '',
      rua: local.rua ?? '',
      numero: local.numero ?? '',
      complemento: local.complemento ?? '',
      bairro: local.bairro ?? '',
      cidade: local.cidade,
      uf: local.uf,
      anotacoes: local.anotacoes ?? '',
      fusoHorario: local.fuso_horario ?? '(UTC-03:00) Brasília',
      latitude: local.latitude ?? '',
      longitude: local.longitude ?? '',
      setores: setoresAgrupados[local.id]?.length ?? 0,
    }))

    setLocais(locaisNormalizados)
    setSetoresPorLocal(setoresAgrupados)
    setIsLoading(false)
  }, [isLoadingUser, user?.id])

  useEffect(() => {
    void carregarLocais()
  }, [carregarLocais])

  const recarregarSetoresAposMutacao = useCallback(async () => {
    const userId = user?.id
    if (!userId) return

    const { data, error } = await supabase
      .from('setores')
      .select('id, local_id, codigo, nome, ativo')
      .eq('user_id', userId)
      .order('codigo', { ascending: true })

    if (error) {
      setErroCarregamento(error.message)
      return
    }

    const setoresAgrupados = agruparSetoresPorLocal(data ?? [])
    setSetoresPorLocal(setoresAgrupados)
    setLocais((atual) =>
      atual.map((local) => ({
        ...local,
        setores: setoresAgrupados[local.id]?.length ?? 0,
      })),
    )
  }, [user?.id])

  const locaisFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return locais

    return locais.filter((local) =>
      [local.nomeFantasia, local.razaoSocial, local.cidade, local.uf, local.cnpj]
        .join(' ')
        .toLowerCase()
        .includes(termo),
    )
  }, [busca, locais])

  function alternarAtivo(localId: string) {
    setLocais((atual) =>
      atual.map((local) =>
        local.id === localId ? { ...local, ativo: !local.ativo } : local,
      ),
    )
  }

  function alternarLocalExpandido(localId: string) {
    setLocalExpandidoId((atual) => (atual === localId ? null : localId))
  }

  function abrirModalNovoSetor(localId: string) {
    setContextoModalSetor({ tipo: 'novo', localId })
    setLocalExpandidoId(localId)
  }

  function abrirModalEditarSetor(localId: string, setor: SetorLocal) {
    setContextoModalSetor({ tipo: 'editar', localId, setor })
  }

  async function alternarSetorAtivo(localId: string, setor: SetorLocal) {
    const userId = user?.id
    if (!userId) return

    setSetorEmOperacaoId(setor.id)
    try {
      const novoAtivo = !setor.ativo
      const { error } = await supabase
        .from('setores')
        .update({ ativo: novoAtivo, updated_at: new Date().toISOString() })
        .eq('id', setor.id)
        .eq('user_id', userId)
        .eq('local_id', localId)

      if (error) {
        setErroCarregamento(error.message)
        return
      }
      await recarregarSetoresAposMutacao()
    } finally {
      setSetorEmOperacaoId(null)
    }
  }

  async function excluirSetor(localId: string, setor: SetorLocal) {
    const userId = user?.id
    if (!userId) return

    const ok = window.confirm(
      `Excluir o setor "${setor.nome}"? Os vínculos de profissionais com este setor também serão removidos.`,
    )
    if (!ok) return

    setSetorEmOperacaoId(setor.id)
    try {
      const { error } = await supabase
        .from('setores')
        .delete()
        .eq('id', setor.id)
        .eq('user_id', userId)
        .eq('local_id', localId)

      if (error) {
        setErroCarregamento(error.message)
        return
      }
      await recarregarSetoresAposMutacao()
    } finally {
      setSetorEmOperacaoId(null)
    }
  }

  return (
    <div className="space-y-5">
      {erroCarregamento ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {erroCarregamento}
        </div>
      ) : null}

      <header className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-600">
              <Building2 className="h-6 w-6" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Gestão de Locais
              </p>
              <h1 className="text-2xl font-semibold text-slate-900">
                Locais de Prestação
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setLocalSelecionado(null)
              setModalLocalAberto(true)
            }}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Novo Local
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative block w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Buscar local, cidade ou CNPJ..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 shadow-sm outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            />
          </label>

          <div className="flex items-center gap-2 text-sm text-slate-500">
            <ShieldAlert className="h-4 w-4 text-amber-500" aria-hidden />
            <span>{locaisFiltrados.length} locais encontrados</span>
          </div>
        </div>
      </header>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200/80">
        <div className="overflow-x-auto">
          <table className="min-w-225 w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Nome do Hospital
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Ativo
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Cidade / UF
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  CNPJ
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Setores
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                    Carregando locais do Supabase...
                  </td>
                </tr>
              ) : locaisFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                    Nenhum local encontrado.
                  </td>
                </tr>
              ) : (
                locaisFiltrados.map((local) => {
                  const expandido = localExpandidoId === local.id
                  const setoresLocal = setoresPorLocal[local.id] ?? []

                  return (
                    <Fragment key={local.id}>
                      <tr
                        className={cn(
                          'cursor-pointer border-b border-slate-200 last:border-b-0 hover:bg-slate-50/60',
                          expandido && 'bg-slate-50/60',
                        )}
                        onClick={() => alternarLocalExpandido(local.id)}
                      >
                        <td className="px-4 py-4 align-middle">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={local.ativo}
                            aria-label={`Marcar ${local.nomeFantasia} como ${local.ativo ? 'inativo' : 'ativo'}`}
                            onClick={(event) => {
                              event.stopPropagation()
                              alternarAtivo(local.id)
                            }}
                            className={cn(
                              'inline-flex h-6 w-11 items-center rounded-full border px-0.5 transition-colors',
                              local.ativo
                                ? 'border-emerald-400 bg-emerald-500'
                                : 'border-slate-300 bg-slate-200',
                            )}
                          >
                            <span
                              className={cn(
                                'h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
                                local.ativo ? 'translate-x-5' : 'translate-x-0',
                              )}
                            />
                          </button>
                        </td>
                        <td className="px-4 py-4 align-middle">
                          <div className="flex items-center gap-1 text-left font-semibold text-primary-600">
                            {local.nomeFantasia} ({local.codigo})
                            <ChevronDown
                              className={cn(
                                'h-4 w-4 shrink-0 transition-transform',
                                expandido && 'rotate-180',
                              )}
                              aria-hidden
                            />
                          </div>
                          <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                            {local.razaoSocial}
                          </p>
                        </td>
                        <td className="px-4 py-4 align-middle text-slate-600">
                          {local.cidade} / {local.uf}
                        </td>
                        <td className="px-4 py-4 align-middle text-slate-600 tabular-nums">
                          {local.cnpj}
                        </td>
                        <td className="px-4 py-4 align-middle">
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" aria-hidden />
                            {local.setores} setores
                          </span>
                        </td>
                        <td className="px-4 py-4 align-middle">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                              onClick={(event) => {
                                event.stopPropagation()
                                setLocalSelecionado(local)
                                setModalLocalAberto(true)
                              }}
                            >
                              <Edit3 className="h-4 w-4" aria-hidden />
                              Editar
                            </button>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-50"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <Trash2 className="h-4 w-4" aria-hidden />
                              Excluir
                            </button>
                          </div>
                        </td>
                      </tr>

                      {expandido ? (
                        <tr className="border-b border-slate-200 bg-slate-50/70">
                          <td colSpan={6} className="px-4 py-4">
                            <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Setores do local
                                  </p>
                                  <h3 className="text-sm font-semibold text-slate-800">
                                    {local.nomeFantasia}
                                  </h3>
                                </div>
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    abrirModalNovoSetor(local.id)
                                  }}
                                  className="inline-flex items-center gap-2 rounded-lg border border-primary-400 bg-white px-4 py-2 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50"
                                >
                                  <Plus className="h-4 w-4" aria-hidden />
                                  + Adicionar Setor
                                </button>
                              </div>

                              <div className="mt-3 space-y-2">
                                {setoresLocal.map((setor) => (
                                  <div
                                    key={setor.id}
                                    className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                                  >
                                    <button
                                      type="button"
                                      role="switch"
                                      aria-checked={setor.ativo}
                                      disabled={setorEmOperacaoId === setor.id}
                                      aria-label={`Marcar setor ${setor.nome} como ${setor.ativo ? 'inativo' : 'ativo'}`}
                                      onClick={(event) => {
                                        event.stopPropagation()
                                        void alternarSetorAtivo(local.id, setor)
                                      }}
                                      className={cn(
                                        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border px-0.5 transition-colors disabled:opacity-50',
                                        setor.ativo
                                          ? 'border-emerald-400 bg-emerald-500'
                                          : 'border-slate-300 bg-slate-200',
                                      )}
                                    >
                                      {setorEmOperacaoId === setor.id ? (
                                        <span className="flex h-4 w-full items-center justify-center">
                                          <Loader2
                                            className="h-3.5 w-3.5 animate-spin text-white"
                                            aria-hidden
                                          />
                                        </span>
                                      ) : (
                                        <span
                                          className={cn(
                                            'h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
                                            setor.ativo ? 'translate-x-4' : 'translate-x-0',
                                          )}
                                        />
                                      )}
                                    </button>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        ({setor.codigo})
                                      </p>
                                      <p className="truncate text-sm font-semibold text-slate-800">
                                        {setor.nome}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
                                        aria-label={`Editar setor ${setor.nome}`}
                                        disabled={setorEmOperacaoId === setor.id}
                                        onClick={(event) => {
                                          event.stopPropagation()
                                          abrirModalEditarSetor(local.id, setor)
                                        }}
                                      >
                                        <Edit3 className="h-4 w-4" aria-hidden />
                                      </button>
                                      <button
                                        type="button"
                                        className="rounded-md p-1.5 text-rose-500 transition-colors hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
                                        aria-label={`Excluir setor ${setor.nome}`}
                                        disabled={setorEmOperacaoId === setor.id}
                                        onClick={(event) => {
                                          event.stopPropagation()
                                          void excluirSetor(local.id, setor)
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" aria-hidden />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SetorFormModal
        contexto={contextoModalSetor}
        userId={user?.id ?? null}
        onFechar={() => setContextoModalSetor(null)}
        onSalvo={() => {
          void recarregarSetoresAposMutacao()
        }}
      />

      <LocalModal
        aberto={modalLocalAberto}
        local={localSelecionado}
        userId={user?.id ?? null}
        onFechar={() => {
          setModalLocalAberto(false)
          setLocalSelecionado(null)
        }}
        onSalvo={() => {
          void carregarLocais()
        }}
      />
    </div>
  )
}
