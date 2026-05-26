import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  UserMinus,
  UserPlus,
} from 'lucide-react'

import {
  ProfissionalDetalhesModal,
  PROFISSOES,
  type FormInformacoes,
  type LocalComSetoresArvore,
} from '../components/Profissionais/ProfissionalDetalhesModal'
import {
  ProfissionalSlideOver,
  type NovoProfissionalInput,
} from '../components/Profissionais/ProfissionalSlideOver'
import type { ProfissionalCompleto } from '../components/Profissionais/profissionalTypes'
import { useSupabaseUser } from '../hooks/useSupabaseUser'
import { cn } from '../lib/cn'
import {
  defaultProfissionalDetalhes,
  detalhesToJson,
  mapRowToProfissionalCompleto,
  mergeFormIntoDetalhes,
  type ProfissionalQueryRow,
} from '../lib/profissionais/mapProfissional'
import { criarAcessoProfissional } from '../lib/profissionais/criarAcessoProfissional'
import { supabase } from '../lib/supabase'

const TAMANHO_PAGINA = 30

const selectClassName =
  'min-w-0 rounded-md border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm text-slate-700 shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'

export function ProfissionaisPage() {
  const { user, isLoading: isLoadingUser } = useSupabaseUser()
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false)
  const [profissionalModal, setProfissionalModal] =
    useState<ProfissionalCompleto | null>(null)
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [irParaPagina, setIrParaPagina] = useState('1')
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  const [lista, setLista] = useState<ProfissionalCompleto[]>([])
  const [totalRegistros, setTotalRegistros] = useState(0)
  const [carregando, setCarregando] = useState(true)
  const [erroLista, setErroLista] = useState<string | null>(null)
  const [filtroLocalId, setFiltroLocalId] = useState('')
  const [filtroProfissao, setFiltroProfissao] = useState('')
  const [opcoesLocais, setOpcoesLocais] = useState<{ id: string; nome: string }[]>(
    [],
  )
  const [locaisComSetoresArvore, setLocaisComSetoresArvore] = useState<
    LocalComSetoresArvore[]
  >([])

  const totalPaginas = Math.max(1, Math.ceil(totalRegistros / TAMANHO_PAGINA))

  const carregar = useCallback(async () => {
    if (isLoadingUser) return
    if (!user) {
      setLista([])
      setTotalRegistros(0)
      setCarregando(false)
      setErroLista(null)
      return
    }

    setCarregando(true)
    setErroLista(null)

    const ini = (paginaAtual - 1) * TAMANHO_PAGINA
    const fim = ini + TAMANHO_PAGINA - 1

    let queryCount = supabase
      .from('profissionais')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (filtroLocalId) {
      queryCount = queryCount.eq('local_id', filtroLocalId)
    }
    if (filtroProfissao) {
      queryCount = queryCount.eq('profissao', filtroProfissao)
    }

    const { count: countResult, error: erroContagem } = await queryCount

    if (erroContagem) {
      setLista([])
      setTotalRegistros(0)
      setErroLista(erroContagem.message)
      setCarregando(false)
      return
    }

    setTotalRegistros(countResult ?? 0)

    let queryData = supabase
      .from('profissionais')
      .select(
        `
          *,
          locais ( nome_fantasia ),
          profissional_setores (
            setor_id,
            setores ( nome, locais ( nome_fantasia ) )
          )
        `,
      )
      .eq('user_id', user.id)
      .order('nome', { ascending: true })

    if (filtroLocalId) {
      queryData = queryData.eq('local_id', filtroLocalId)
    }
    if (filtroProfissao) {
      queryData = queryData.eq('profissao', filtroProfissao)
    }

    const { data, error } = await queryData.range(ini, fim)

    if (error) {
      setLista([])
      setErroLista(error.message)
      setCarregando(false)
      return
    }

    const rows = (data ?? []) as ProfissionalQueryRow[]
    setLista(rows.map(mapRowToProfissionalCompleto))
    setCarregando(false)
  }, [
    user,
    isLoadingUser,
    paginaAtual,
    filtroLocalId,
    filtroProfissao,
  ])

  useEffect(() => {
    void carregar()
  }, [carregar])

  useEffect(() => {
    let ativo = true
    if (!user) {
      setOpcoesLocais([])
      return
    }
    void supabase
      .from('locais')
      .select('id, nome_fantasia')
      .eq('user_id', user.id)
      .order('nome_fantasia', { ascending: true })
      .then(({ data, error }) => {
        if (!ativo) return
        if (error || !data) {
          setOpcoesLocais([])
          return
        }
        setOpcoesLocais(
          data.map((l) => ({
            id: l.id,
            nome: l.nome_fantasia,
          })),
        )
      })
    return () => {
      ativo = false
    }
  }, [user])

  useEffect(() => {
    let ativo = true
    if (!user) {
      setLocaisComSetoresArvore([])
      return
    }
    void (async () => {
      const [locRes, setRes] = await Promise.all([
        supabase
          .from('locais')
          .select('id, nome_fantasia')
          .eq('user_id', user.id)
          .order('nome_fantasia', { ascending: true }),
        supabase
          .from('setores')
          .select('id, nome, local_id')
          .eq('user_id', user.id)
          .eq('ativo', true)
          .order('nome', { ascending: true }),
      ])
      if (!ativo) return
      if (locRes.error || setRes.error || !locRes.data || !setRes.data) {
        setLocaisComSetoresArvore([])
        return
      }
      const porLocal = new Map<string, { id: string; nome: string }[]>()
      for (const s of setRes.data) {
        const lista = porLocal.get(s.local_id) ?? []
        lista.push({ id: s.id, nome: s.nome })
        porLocal.set(s.local_id, lista)
      }
      const arvore: LocalComSetoresArvore[] = locRes.data.map((l) => ({
        id: l.id,
        nome: l.nome_fantasia,
        setores: porLocal.get(l.id) ?? [],
      }))
      setLocaisComSetoresArvore(arvore.filter((item) => item.setores.length > 0))
    })()
    return () => {
      ativo = false
    }
  }, [user])

  useEffect(() => {
    setIrParaPagina(String(paginaAtual))
  }, [paginaAtual])

  useEffect(() => {
    setPaginaAtual(1)
  }, [filtroLocalId, filtroProfissao])

  const indicesVisiveis = useMemo(() => {
    if (totalRegistros === 0) return { ini: 0, fim: 0 }
    const ini = (paginaAtual - 1) * TAMANHO_PAGINA + 1
    const fim = Math.min(paginaAtual * TAMANHO_PAGINA, totalRegistros)
    return { ini, fim }
  }, [paginaAtual, totalRegistros])

  const todosDaPaginaIds = lista.map((p) => p.id)
  const todosMarcados =
    todosDaPaginaIds.length > 0 &&
    todosDaPaginaIds.every((id) => selecionados.has(id))

  function alternarTodos() {
    setSelecionados((prev) => {
      const next = new Set(prev)
      if (todosMarcados) {
        todosDaPaginaIds.forEach((id) => next.delete(id))
      } else {
        todosDaPaginaIds.forEach((id) => next.add(id))
      }
      return next
    })
  }

  function alternarLinha(id: string) {
    setSelecionados((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function irParaPaginaSubmit() {
    const n = parseInt(irParaPagina, 10)
    if (Number.isFinite(n) && n >= 1 && n <= totalPaginas) {
      setPaginaAtual(n)
    }
  }

  const listaPaginas = useMemo(() => {
    const listaNums: number[] = []
    const maxVis = 6
    for (let i = 1; i <= Math.min(totalPaginas, maxVis); i++) listaNums.push(i)
    return listaNums
  }, [totalPaginas])

  const handleCreate = useCallback(
    async (input: NovoProfissionalInput) => {
      if (!user) return { error: 'Sessão inválida.' }
      const detalhes = defaultProfissionalDetalhes(input.siglaConselho)
      detalhes.email = input.email
      detalhes.telefone = input.telefone
      detalhes.cpf = input.cpf

      const { data: inserido, error } = await supabase
        .from('profissionais')
        .insert({
          user_id: user.id,
          nome: input.nome,
          profissao: input.profissao,
          sigla_conselho: input.siglaConselho,
          conselho_numero: input.conselhoNumero,
          registro_uf: input.registroUf,
          email: input.email.trim() || null,
          telefone: input.telefone.trim() || null,
          cpf: input.cpf.trim() || null,
          local_id: input.localId.trim() || null,
          detalhes: detalhesToJson(detalhes),
        })
        .select('id')
        .single()

      if (error) return { error: error.message }

      const profissionalId = inserido.id

      if (input.setoresVinculadosIds.length > 0) {
        const { error: erroSetores } = await supabase.from('profissional_setores').insert(
          input.setoresVinculadosIds.map((setor_id) => ({
            user_id: user.id,
            profissional_id: profissionalId,
            setor_id,
          })),
        )
        if (erroSetores) {
          return {
            error: `Profissional criado, mas falhou ao vincular setores: ${erroSetores.message}`,
          }
        }
      }

      if (input.criarAcesso && input.email.trim()) {
        try {
          await criarAcessoProfissional({
            profissionalId,
            email: input.email,
            nome: input.nome,
            permissoes: input.permissoes,
          })
        } catch (e) {
          await carregar()
          const msg = e instanceof Error ? e.message : 'Erro ao criar acesso.'
          return {
            error: `Profissional criado, mas o acesso não foi criado: ${msg}`,
          }
        }
      }

      await carregar()
      return {}
    },
    [user, carregar],
  )

  const handleSave = useCallback(
    async (id: string, form: FormInformacoes) => {
      if (!user) return { error: 'Sessão inválida.' }
      const current = profissionalModal
      if (!current || current.id !== id) {
        return { error: 'Recarregue os dados e tente novamente.' }
      }
      const nextDetalhes = mergeFormIntoDetalhes(current, form)
      const siglaConselho = nextDetalhes.siglaConselho.trim() || 'CRM'
      const { error } = await supabase
        .from('profissionais')
        .update({
          nome: form.nomeCompleto.trim(),
          profissao: form.profissao,
          sigla_conselho: siglaConselho,
          conselho_numero: form.numeroCrm.trim(),
          registro_uf: form.ufCrm.trim(),
          email: form.email.trim() || null,
          telefone: form.telefone1.trim() || null,
          cpf: form.cpf.trim() || null,
          local_id: form.localId.trim() || null,
          detalhes: detalhesToJson({ ...nextDetalhes, siglaConselho }),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id)
      if (error) return { error: error.message }

      const { error: erroRemocaoVinculos } = await supabase
        .from('profissional_setores')
        .delete()
        .eq('profissional_id', id)
        .eq('user_id', user.id)
      if (erroRemocaoVinculos) return { error: erroRemocaoVinculos.message }

      const idsSetores = form.setoresVinculadosIds
      if (idsSetores.length > 0) {
        const { error: erroInsercaoVinculos } = await supabase
          .from('profissional_setores')
          .insert(
            idsSetores.map((setor_id) => ({
              user_id: user.id,
              profissional_id: id,
              setor_id,
            })),
          )
        if (erroInsercaoVinculos) return { error: erroInsercaoVinculos.message }
      }

      await carregar()
      return {}
    },
    [user, profissionalModal, carregar],
  )

  const handleDelete = useCallback(
    async (id: string) => {
      if (!user) return { error: 'Sessão inválida.' }
      const { error } = await supabase
        .from('profissionais')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
      if (error) return { error: error.message }
      await carregar()
      return {}
    },
    [user, carregar],
  )

  return (
    <div className="relative mx-auto w-full max-w-7xl pb-16">
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-slate-900">
        Profissionais
      </h1>

      {erroLista ? (
        <p
          className="mb-4 rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-800"
          role="alert"
        >
          {erroLista}
        </p>
      ) : null}

      <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <button
          type="button"
          onClick={() => setIsSlideOverOpen(true)}
          disabled={!user}
          className="inline-flex w-fit items-center justify-center gap-2 rounded-md bg-[#007bff] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0069d9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007bff] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4 shrink-0" aria-hidden />
          Adicionar Profissional
        </button>

        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <span className="whitespace-nowrap">Ir para a página:</span>
            <input
              type="text"
              inputMode="numeric"
              value={irParaPagina}
              onChange={(e) => setIrParaPagina(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && irParaPaginaSubmit()}
              className="h-9 w-12 rounded border border-slate-300 bg-white px-2 text-center text-sm text-slate-900 tabular-nums outline-none focus:border-[#007bff] focus:ring-1 focus:ring-[#007bff]"
              aria-label="Número da página"
            />
          </div>

          <nav
            className="flex flex-wrap items-center gap-1"
            aria-label="Paginação"
          >
            <button
              type="button"
              disabled={paginaAtual <= 1 || carregando}
              onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Anterior
            </button>
            {listaPaginas.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPaginaAtual(n)}
                className={cn(
                  'min-w-9 rounded border px-3 py-1.5 text-sm tabular-nums transition-colors',
                  n === paginaAtual
                    ? 'border-[#007bff] bg-white font-medium text-[#007bff]'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
                )}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              disabled={paginaAtual >= totalPaginas || carregando}
              onClick={() =>
                setPaginaAtual((p) => Math.min(totalPaginas, p + 1))
              }
              className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              Próximo
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </nav>

          <p className="text-sm whitespace-nowrap text-slate-500">
            Exibindo {indicesVisiveis.ini} a {indicesVisiveis.fim} de{' '}
            {totalRegistros}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
            <input
              type="checkbox"
              checked={todosMarcados}
              onChange={alternarTodos}
              disabled={lista.length === 0 || carregando}
              className="h-4 w-4 shrink-0 rounded border-slate-300 text-primary focus:ring-primary"
              aria-label="Selecionar todos os profissionais nesta página"
            />

            <select
              className={selectClassName}
              value={filtroLocalId}
              onChange={(e) => setFiltroLocalId(e.target.value)}
            >
              <option value="">Todos os locais, setores</option>
              {opcoesLocais.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nome}
                </option>
              ))}
            </select>

            <select
              className={selectClassName}
              value={filtroProfissao}
              onChange={(e) => setFiltroProfissao(e.target.value)}
            >
              <option value="">Todas profissões</option>
              {PROFISSOES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md border border-[#007bff]/40 bg-white px-3 py-2 text-sm font-medium text-[#007bff] transition-colors hover:bg-blue-50"
            >
              <UserMinus className="h-4 w-4 shrink-0" aria-hidden />
              Remover Selecionados de um Grupo
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md border border-[#007bff]/40 bg-white px-3 py-2 text-sm font-medium text-[#007bff] transition-colors hover:bg-blue-50"
            >
              <UserPlus className="h-4 w-4 shrink-0" aria-hidden />
              Adicionar Selecionados a um Grupo
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {carregando ? (
            <div className="flex items-center justify-center gap-2 py-16 text-slate-600">
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
              Carregando profissionais...
            </div>
          ) : (
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th scope="col" className="w-10 px-3 py-3.5" />
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-600"
                  >
                    Nome
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-600"
                  >
                    Profissão
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-600"
                  >
                    Registro Profissional
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-right text-xs font-semibold uppercase tracking-wide"
                  >
                    <span className="text-orange-600">Local</span>
                    <span className="text-slate-300"> / </span>
                    <span className="text-teal-600">Setor</span>
                    <span className="text-slate-300"> / </span>
                    <span className="text-slate-500">Grupo</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {lista.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-10 text-center text-slate-600"
                    >
                      Nenhum profissional cadastrado. Use &quot;Adicionar
                      Profissional&quot; para incluir o primeiro registro.
                    </td>
                  </tr>
                ) : (
                  lista.map((profissional) => (
                    <tr
                      key={profissional.id}
                      className="border-b border-slate-200 last:border-b-0 hover:bg-slate-50/50"
                    >
                      <td className="px-3 py-4 align-middle">
                        <input
                          type="checkbox"
                          checked={selecionados.has(profissional.id)}
                          onChange={() => alternarLinha(profissional.id)}
                          className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                          aria-label={`Selecionar ${profissional.nome}`}
                        />
                      </td>
                      <td className="px-3 py-4 align-middle">
                        <button
                          type="button"
                          onClick={() => setProfissionalModal(profissional)}
                          className="text-left font-medium text-[#007bff] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007bff]"
                        >
                          {profissional.nome}
                        </button>
                      </td>
                      <td className="px-3 py-4 align-middle text-slate-600">
                        {profissional.profissao}
                      </td>
                      <td className="px-3 py-4 align-middle text-slate-600 tabular-nums">
                        {profissional.registroProfissional}
                      </td>
                      <td className="px-3 py-4 align-middle text-right">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          <span className="inline-block max-w-full rounded px-2 py-0.5 text-xs font-medium text-amber-950 bg-amber-200/90">
                            {profissional.localNome}
                          </span>
                          {profissional.setores.map((setor) => (
                            <span
                              key={`${profissional.id}-${setor}`}
                              className="inline-block max-w-full rounded px-2 py-0.5 text-xs font-medium text-teal-950 bg-teal-200/90"
                            >
                              {setor}
                            </span>
                          ))}
                          {profissional.nomesGruposLista.map((nomeGrupo, idxGrupo) => (
                            <span
                              key={`${profissional.id}-grp-${nomeGrupo}-${idxGrupo}`}
                              className="inline-block max-w-full rounded px-2 py-0.5 text-xs font-medium text-slate-800 bg-slate-200/90"
                            >
                              {nomeGrupo}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <ProfissionalDetalhesModal
        open={profissionalModal !== null}
        profissional={profissionalModal}
        locaisOpcoes={opcoesLocais}
        locaisComSetoresArvore={locaisComSetoresArvore}
        onClose={() => setProfissionalModal(null)}
        onSave={handleSave}
        onDelete={handleDelete}
      />

      <ProfissionalSlideOver
        open={isSlideOverOpen}
        onClose={() => setIsSlideOverOpen(false)}
        onCreate={handleCreate}
        locaisOpcoes={opcoesLocais}
        locaisComSetoresArvore={locaisComSetoresArvore}
      />
    </div>
  )
}
