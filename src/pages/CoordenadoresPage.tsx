import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Search,
  UserCircle,
  UserMinus,
  UserPlus,
} from 'lucide-react'

import { CoordenadorModal } from '../components/Coordenadores/CoordenadorModal'
import type { CoordenadorCompleto, FormCoordenador } from '../components/Coordenadores/coordenadorTypes'
import { useCatalogoLocaisSetores } from '../hooks/useCatalogoLocaisSetores'
import { useSupabaseUser } from '../hooks/useSupabaseUser'
import { cn } from '../lib/cn'
import { montarArvoreLocaisSetores } from '../stores/catalogoLocaisSetoresStore'
import type { CoordenadorQueryRow } from '../lib/coordenadores/mapCoordenador'
import {
  detalhesCoordenadorParaJson,
  mapRowToCoordenadorCompleto,
  mergeFormCoordenador,
  novoCoordenadorRascunho,
} from '../lib/coordenadores/mapCoordenador'
import { supabase } from '../lib/supabase'

const TAMANHO_PAGINA = 30

const selectClass =
  'min-w-0 rounded-md border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm text-slate-700 shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'

export function CoordenadoresPage() {
  const { user, isLoading: isLoadingUser } = useSupabaseUser()
  const { locais, setoresPorLocalId } = useCatalogoLocaisSetores()
  const [coordModal, setCoordModal] = useState<{
    modo: 'criar' | 'editar'
    coordenador: CoordenadorCompleto
  } | null>(null)
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [irParaPagina, setIrParaPagina] = useState('1')
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  const [lista, setLista] = useState<CoordenadorCompleto[]>([])
  const [totalRegistros, setTotalRegistros] = useState(0)
  const [carregando, setCarregando] = useState(true)
  const [erroLista, setErroLista] = useState<string | null>(null)
  const [filtroLocalId, setFiltroLocalId] = useState('')
  const [busca, setBusca] = useState('')

  const opcoesLocais = useMemo(
    () => locais.map((local) => ({ id: local.id, nome: local.nome })),
    [locais],
  )
  const arvoreLocaisSetores = useMemo(
    () => montarArvoreLocaisSetores(locais, setoresPorLocalId),
    [locais, setoresPorLocalId],
  )

  const totalPaginas = Math.max(1, Math.ceil(totalRegistros / TAMANHO_PAGINA))

  function eNaoEncontrado(): string {
    return (
      'Tabela «coordenadores» não encontrada. Aplique a migração em supabase/migrations (20260520120000_coordenadores.sql) ao seu projeto.'
    )
  }

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

    let qc = supabase
      .from('coordenadores')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (filtroLocalId) qc = qc.eq('local_id', filtroLocalId)
    const buscaL = busca.trim()
    if (buscaL) {
      const esc = buscaL.replace(/"/g, '')
      qc = qc.or(`nome.ilike."%${esc}%",email.ilike."%${esc}%"`)
    }

    const { count: c1, error: e1 } = await qc

    if (e1) {
      setLista([])
      setErroLista(e1.message.includes('coordenadores') ? eNaoEncontrado() : e1.message)
      setTotalRegistros(0)
      setCarregando(false)
      return
    }

    setTotalRegistros(c1 ?? 0)

    let qData = supabase
      .from('coordenadores')
      .select(
        `
          *,
          locais ( nome_fantasia ),
          coordenador_setores (
            setor_id,
            setores ( nome, locais ( nome_fantasia ) )
          )
        `,
      )
      .eq('user_id', user.id)
      .order('nome', { ascending: true })

    if (filtroLocalId) qData = qData.eq('local_id', filtroLocalId)
    if (buscaL) {
      const esc = buscaL.replace(/"/g, '')
      qData = qData.or(`nome.ilike."%${esc}%",email.ilike."%${esc}%"`)
    }

    const { data, error: e2 } = await qData.range(ini, fim)

    if (e2) {
      setLista([])
      setErroLista(e2.message.includes('coordenadores') ? eNaoEncontrado() : e2.message)
      setCarregando(false)
      return
    }

    const rows = (data ?? []) as CoordenadorQueryRow[]
    setLista(rows.map(mapRowToCoordenadorCompleto))
    setCarregando(false)
  }, [user, isLoadingUser, paginaAtual, filtroLocalId, busca])

  useEffect(() => void carregar(), [carregar])

  useEffect(() => setIrParaPagina(String(paginaAtual)), [paginaAtual])
  useEffect(() => setPaginaAtual(1), [filtroLocalId, busca])

  const indicesVisiveis = useMemo(() => {
    if (totalRegistros === 0) return { ini: 0, fim: 0 }
    const ini = (paginaAtual - 1) * TAMANHO_PAGINA + 1
    const fim = Math.min(paginaAtual * TAMANHO_PAGINA, totalRegistros)
    return { ini, fim }
  }, [paginaAtual, totalRegistros])

  const todosIdsPagina = lista.map((c) => c.id)
  const todosMarcados =
    todosIdsPagina.length > 0 && todosIdsPagina.every((id) => selecionados.has(id))

  function alternarTodos() {
    setSelecionados((prev) => {
      const next = new Set(prev)
      if (todosMarcados) todosIdsPagina.forEach((id) => next.delete(id))
      else todosIdsPagina.forEach((id) => next.add(id))
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

  const listaPaginas = useMemo(() => {
    const n: number[] = []
    const maxVis = 6
    for (let i = 1; i <= Math.min(totalPaginas, maxVis); i++) n.push(i)
    return n
  }, [totalPaginas])

  function irParaPaginaSubmit() {
    const n = parseInt(irParaPagina, 10)
    if (Number.isFinite(n) && n >= 1 && n <= totalPaginas) setPaginaAtual(n)
  }

  function erroAmigavel(msg: string): string {
    if (msg.includes('coordenadores') && (msg.includes('schema') || msg.includes('exist')))
      return eNaoEncontrado()
    return msg
  }

  const handlePersist = useCallback(
    async (baseline: CoordenadorCompleto, form: FormCoordenador) => {
      if (!user) return { error: 'Sessão inválida.' }
      const isNovo = !baseline.id.trim()
      const nextDetalhes = mergeFormCoordenador(baseline, form)

      if (isNovo) {
        const { data: criado, error } = await supabase
          .from('coordenadores')
          .insert({
            user_id: user.id,
            nome: form.nomeCompleto.trim(),
            email: form.email.trim() || null,
            telefone: form.telefone1.trim() || null,
            telefone2: form.telefone2.trim() || null,
            local_id: form.localId.trim() || null,
            detalhes: detalhesCoordenadorParaJson(nextDetalhes),
          })
          .select('id')
          .single()

        if (error) return { error: erroAmigavel(error.message) }

        const newId = criado?.id
        if (!newId) return { error: 'Não foi possível obter o id do novo registo.' }

        const ids = form.setoresVinculadosIds
        if (ids.length > 0) {
          const { error: insEr } = await supabase.from('coordenador_setores').insert(
            ids.map((setor_id) => ({
              user_id: user.id,
              coordenador_id: newId,
              setor_id,
            })),
          )
          if (insEr) return { error: insEr.message }
        }

        await carregar()
        return {}
      }

      const id = baseline.id
      const { error } = await supabase
        .from('coordenadores')
        .update({
          nome: form.nomeCompleto.trim(),
          email: form.email.trim() || null,
          telefone: form.telefone1.trim() || null,
          telefone2: form.telefone2.trim() || null,
          local_id: form.localId.trim() || null,
          detalhes: detalhesCoordenadorParaJson(nextDetalhes),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) return { error: erroAmigavel(error.message) }

      const { error: delEr } = await supabase
        .from('coordenador_setores')
        .delete()
        .eq('coordenador_id', id)
        .eq('user_id', user.id)
      if (delEr) return { error: delEr.message }

      const ids = form.setoresVinculadosIds
      if (ids.length > 0) {
        const { error: insEr } = await supabase.from('coordenador_setores').insert(
          ids.map((setor_id) => ({
            user_id: user.id,
            coordenador_id: id,
            setor_id,
          })),
        )
        if (insEr) return { error: insEr.message }
      }

      await carregar()
      return {}
    },
    [user, carregar],
  )

  const handleDelete = useCallback(
    async (id: string) => {
      if (!user) return { error: 'Sessão inválida.' }
      const { error } = await supabase
        .from('coordenadores')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
      if (error) return { error: erroAmigavel(error.message) }
      await carregar()
      return {}
    },
    [user, carregar],
  )

  return (
    <div className="relative mx-auto w-full max-w-7xl pb-16">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            USUÁRIOS /{' '}
            <span className="text-slate-600">
              COORDENADORES ({totalRegistros})
            </span>
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            Coordenadores
          </h1>
        </div>

        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Pesquisar por coordenador..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className={cn(selectClass, 'w-full rounded-lg py-2.5 pl-10 pr-3')}
          />
        </div>
      </div>

      {erroLista ? (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          {erroLista}
        </p>
      ) : null}

      <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <button
          type="button"
          disabled={!user || Boolean(erroLista?.includes('Tabela'))}
          onClick={() =>
            setCoordModal({ modo: 'criar', coordenador: novoCoordenadorRascunho() })
          }
          className="inline-flex w-fit items-center gap-2 rounded-md bg-[#007bff] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#0069d9] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Adicionar Coordenador
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm whitespace-nowrap text-slate-500">Ir para a página:</span>
          <input
            inputMode="numeric"
            value={irParaPagina}
            onChange={(e) => setIrParaPagina(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && irParaPaginaSubmit()}
            className="h-9 w-12 rounded border border-slate-300 px-2 text-center text-sm outline-none focus:border-[#007bff]"
          />
          <nav className="flex flex-wrap items-center gap-1" aria-label="Paginação">
            <button
              type="button"
              disabled={paginaAtual <= 1 || carregando}
              onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 rounded border bg-white px-2 py-1.5 text-sm disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" /> Anterior
            </button>
            {listaPaginas.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPaginaAtual(n)}
                className={cn(
                  'min-w-9 rounded border px-3 py-1.5 text-sm',
                  n === paginaAtual ? 'border-[#007bff] font-medium text-[#007bff]' : 'border-slate-300',
                )}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              disabled={paginaAtual >= totalPaginas || carregando}
              onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
              className="inline-flex items-center gap-1 rounded border bg-white px-2 py-1.5 text-sm disabled:opacity-40"
            >
              Próximo <ChevronRight className="h-4 w-4" />
            </button>
          </nav>
          <p className="text-sm tabular-nums text-slate-500">
            {indicesVisiveis.ini}-{indicesVisiveis.fim} de {totalRegistros}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-4 py-3">
          <input
            type="checkbox"
            checked={todosMarcados && todosIdsPagina.length > 0}
            disabled={lista.length === 0 || carregando}
            onChange={alternarTodos}
            className="h-4 w-4 shrink-0 rounded border-slate-300"
            aria-label="Selecionar todos"
          />
          <select
            className={selectClass}
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
          <div className="ml-auto flex flex-wrap gap-2">
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-2 rounded-md border border-[#007bff]/40 px-3 py-2 text-sm text-[#007bff] opacity-50"
            >
              <UserMinus className="h-4 w-4" aria-hidden /> Remover Selecionados de um Grupo
            </button>
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-2 rounded-md border border-[#007bff]/40 px-3 py-2 text-sm text-[#007bff] opacity-50"
            >
              <UserPlus className="h-4 w-4" aria-hidden /> Adicionar Selecionados a um Grupo
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {carregando ? (
            <div className="flex items-center justify-center gap-2 py-14 text-slate-600">
              <Loader2 className="h-6 w-6 animate-spin" /> Carregando…
            </div>
          ) : lista.length === 0 ? (
            <p className="px-4 py-12 text-center text-sm text-slate-600">
              {lista.length === 0
                ? 'Nenhum coordenador cadastrado. Use «Adicionar Coordenador».'
                : 'Nenhum resultado para esta pesquisa.'}
            </p>
          ) : (
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="w-12 px-3 py-3" />
                  <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Nome
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">
                    <span className="text-orange-600">Local</span>
                    <span className="text-slate-300"> / </span>
                    <span className="text-sky-600">Setor</span>
                    <span className="text-slate-300"> / </span>
                    <span className="text-slate-500">Grupo</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {lista.map((c) => (
                  <tr key={c.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                    <td className="px-3 py-4 align-middle">
                      <input
                        type="checkbox"
                        checked={selecionados.has(c.id)}
                        onChange={() => alternarLinha(c.id)}
                        className="h-4 w-4 rounded border-slate-300"
                        aria-label={`Selecionar ${c.nome}`}
                      />
                    </td>
                    <td className="px-3 py-4 align-middle">
                      <button
                        type="button"
                        onClick={() => setCoordModal({ modo: 'editar', coordenador: c })}
                        className="flex items-center gap-3 text-left"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-600">
                          <UserCircle className="h-5 w-5" aria-hidden />
                        </span>
                        <span className="font-medium text-[#007bff] hover:underline">{c.nome}</span>
                      </button>
                    </td>
                    <td className="px-3 py-4 align-middle text-right">
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        <span className="inline-block max-w-full rounded px-2 py-0.5 text-xs font-medium text-amber-950 bg-amber-200/90">
                          {c.localNome}
                        </span>
                        {c.setores.map((nome) =>
                          nome !== '—' ? (
                            <span
                              key={`${c.id}-s-${nome}`}
                              className="inline-block max-w-full rounded px-2 py-0.5 text-xs font-medium text-sky-950 bg-sky-200/90"
                            >
                              {nome}
                            </span>
                          ) : null,
                        )}
                        {c.nomesGruposLista.map((g, i) =>
                          g !== '—' ? (
                            <span
                              key={`${c.id}-g-${i}-${g}`}
                              className="inline-block max-w-full rounded px-2 py-0.5 text-xs font-medium text-slate-800 bg-slate-200/90"
                            >
                              {g}
                            </span>
                          ) : null,
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <CoordenadorModal
        open={coordModal !== null}
        modo={coordModal?.modo ?? 'editar'}
        coordenador={coordModal?.coordenador ?? null}
        locaisOpcoes={opcoesLocais}
        locaisComSetoresArvore={arvoreLocaisSetores}
        onClose={() => setCoordModal(null)}
        onSave={handlePersist}
        onDelete={(id) => handleDelete(id)}
      />
    </div>
  )
}
