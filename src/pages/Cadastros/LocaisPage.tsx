import {
  Building2,
  Edit3,
  ChevronDown,
  MapPin,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { Fragment, useEffect, useMemo, useState } from 'react'

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

const inputClassName =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100'

type LocalModalProps = {
  aberto: boolean
  local: LocalCadastro | null
  onFechar: () => void
}

function LocalModal({ aberto, local, onFechar }: LocalModalProps) {
  if (!aberto) return null

  const titulo = local ? local.nomeFantasia : 'Novo Local'
  const subtitulo = local ? 'ALTERAR LOCAL' : 'NOVO LOCAL'

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
              {titulo}
            </h2>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              {subtitulo}
            </p>
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

        <form className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 md:px-6">
            <div className="grid gap-5">
              <div className="grid gap-4 md:grid-cols-[1fr_2fr_1fr]">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-600">
                    Código
                  </label>
                  <input
                    type="text"
                    className={inputClassName}
                    defaultValue={local?.codigo ?? '000'}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-600">
                    Nome *
                  </label>
                  <input
                    type="text"
                    className={inputClassName}
                    defaultValue={local?.nomeFantasia ?? ''}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-600">
                    CEP
                  </label>
                  <input type="text" className={inputClassName} defaultValue={local?.cep ?? ''} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[2fr_1fr_1fr]">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-600">
                    Rua *
                  </label>
                  <input type="text" className={inputClassName} defaultValue={local?.rua ?? ''} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-600">
                    Nº *
                  </label>
                  <input
                    type="text"
                    className={inputClassName}
                    defaultValue={local?.numero ?? ''}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-600">
                    Compl.
                  </label>
                  <input
                    type="text"
                    className={inputClassName}
                    defaultValue={local?.complemento ?? ''}
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
                    defaultValue={local?.bairro ?? ''}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-600">
                    UF *
                  </label>
                  <select className={inputClassName} defaultValue={local?.uf ?? 'AM'}>
                    {['AM', 'BA', 'MG', 'PA', 'SP', 'RJ', 'PR', 'SC', 'RS'].map((uf) => (
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
                    defaultValue={local?.cidade ?? ''}
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
                    defaultValue={local?.razaoSocial ?? ''}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-600">
                    CNPJ
                  </label>
                  <input
                    type="text"
                    className={inputClassName}
                    defaultValue={local?.cnpj ?? ''}
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
                    defaultValue={local?.anotacoes ?? ''}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-600">
                    Fuso horário
                  </label>
                  <select className={inputClassName} defaultValue={local?.fusoHorario ?? '(UTC-03:00) Brasília'}>
                    <option value="(UTC-04:00) Manaus">(UTC-04:00) Manaus</option>
                    <option value="(UTC-03:00) Brasília">(UTC-03:00) Brasília</option>
                    <option value="(UTC-02:00) Fernando de Noronha">(UTC-02:00) Fernando de Noronha</option>
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
                      defaultValue={local?.latitude ?? ''}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-600">
                      Longitude
                    </label>
                    <input
                      type="text"
                      className={inputClassName}
                      defaultValue={local?.longitude ?? ''}
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
                <h3 className="text-sm font-semibold text-slate-800">
                  Logotipo do local
                </h3>
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
                  className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
                  onClick={onFechar}
                >
                  Salvar
                </button>
              </div>
            </div>
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

  useEffect(() => {
    let isMounted = true

    async function carregarLocais() {
      if (isLoadingUser) return
      if (!user) {
        if (!isMounted) return
        setLocais([])
        setSetoresPorLocal({})
        setErroCarregamento(null)
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setErroCarregamento(null)

      const [locaisResponse, setoresResponse] = await Promise.all([
        supabase
          .from('locais')
          .select(
            'id, codigo, ativo, nome_fantasia, razao_social, cnpj, telefone, cep, rua, numero, complemento, bairro, cidade, uf, anotacoes, fuso_horario, latitude, longitude',
          )
          .order('nome_fantasia', { ascending: true }),
        supabase
          .from('setores')
          .select('id, local_id, codigo, nome, ativo')
          .order('codigo', { ascending: true }),
      ])

      if (!isMounted) return

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

      const setoresAgrupados = setoresData.reduce<Record<string, SetorLocal[]>>(
        (acc, setor) => {
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
        },
        {},
      )

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
    }

    void carregarLocais()

    return () => {
      isMounted = false
    }
  }, [isLoadingUser, user])

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

  function adicionarSetor(localId: string) {
    setSetoresPorLocal((atual) => {
      const listaAtual = atual[localId] ?? []
      const novoCodigo = String(listaAtual.length + 1).padStart(3, '0')
      const novoSetor: SetorLocal = {
        id: `${localId}-set-${listaAtual.length + 1}`,
        localId,
        codigo: novoCodigo,
        nome: 'NOVO SETOR',
        ativo: true,
      }

      const novoMapa = { ...atual, [localId]: [...listaAtual, novoSetor] }

      setLocais((locaisAtuais) =>
        locaisAtuais.map((local) =>
          local.id === localId
            ? { ...local, setores: (atual[localId]?.length ?? 0) + 1 }
            : local,
        ),
      )

      return novoMapa
    })
    setLocalExpandidoId(localId)
  }

  function alternarSetorAtivo(localId: string, setorId: string) {
    setSetoresPorLocal((atual) => {
      const listaAtual = atual[localId] ?? []
      return {
        ...atual,
        [localId]: listaAtual.map((setor) =>
          setor.id === setorId ? { ...setor, ativo: !setor.ativo } : setor,
        ),
      }
    })
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
                                    adicionarSetor(local.id)
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
                                      aria-label={`Marcar setor ${setor.nome} como ${setor.ativo ? 'inativo' : 'ativo'}`}
                                      onClick={(event) => {
                                        event.stopPropagation()
                                        alternarSetorAtivo(local.id, setor.id)
                                      }}
                                      className={cn(
                                        'inline-flex h-5 w-9 shrink-0 items-center rounded-full border px-0.5 transition-colors',
                                        setor.ativo
                                          ? 'border-emerald-400 bg-emerald-500'
                                          : 'border-slate-300 bg-slate-200',
                                      )}
                                    >
                                      <span
                                        className={cn(
                                          'h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
                                          setor.ativo ? 'translate-x-4' : 'translate-x-0',
                                        )}
                                      />
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
                                        className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                                        aria-label={`Editar setor ${setor.nome}`}
                                        onClick={(event) => event.stopPropagation()}
                                      >
                                        <Edit3 className="h-4 w-4" aria-hidden />
                                      </button>
                                      <button
                                        type="button"
                                        className="rounded-md p-1.5 text-rose-500 transition-colors hover:bg-rose-50 hover:text-rose-700"
                                        aria-label={`Excluir setor ${setor.nome}`}
                                        onClick={(event) => event.stopPropagation()}
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

      <LocalModal
        aberto={modalLocalAberto}
        local={localSelecionado}
        onFechar={() => {
          setModalLocalAberto(false)
          setLocalSelecionado(null)
        }}
      />
    </div>
  )
}
