import {
  Eye,
  History,
  Loader2,
  Printer,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { PreviewRelatorioHistorico } from '../../features/relatorios/components/PreviewRelatorioHistorico'
import { RelatorioWorkflowPainel } from '../../features/relatorios/components/RelatorioWorkflowPainel'
import {
  ROTULOS_TIPO_RELATORIO,
  parseHistoricoParaPreview,
} from '../../features/relatorios/utils/parseHistoricoRelatorio'
import {
  ROTULOS_STATUS_WORKFLOW,
  statusWorkflowSeguro,
} from '../../features/relatorios/workflow/relatorioWorkflowTypes'
import { useTenantUserId } from '../../hooks/useTenantUserId'
import { useWorkflowRelatorioRole } from '../../hooks/useWorkflowRelatorioRole'
import { cn } from '../../lib/cn'
import {
  excluirHistoricoRelatorio,
  listarHistoricoRelatorios,
  type RelatorioHistoricoRow,
  type TipoRelatorioHistorico,
} from '../../lib/relatorios/relatoriosHistoricoDb'
import { useThemeBranding } from '../../theme/ThemeBrandingProvider'

const TODOS_TIPOS = 'todos'

function formatarDataHora(iso: string): string {
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
}

function BadgeStatusWorkflow({ status }: { status: RelatorioHistoricoRow['status_workflow'] }) {
  const seguro = statusWorkflowSeguro(status)
  const rotulo = ROTULOS_STATUS_WORKFLOW[seguro]

  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold',
        seguro === 'rascunho' && 'bg-slate-100 text-slate-700',
        seguro === 'em_auditoria' && 'bg-primary-50 text-primary-800',
        seguro === 'aprovado' && 'bg-success-50 text-success-800',
        seguro === 'faturado' && 'bg-slate-200 text-slate-800',
      )}
    >
      {rotulo}
    </span>
  )
}

export function HistoricoRelatoriosPage() {
  const { user, tenantUserId, isLoading: authLoading } = useTenantUserId()
  const { logoUrl } = useThemeBranding()
  const { isCoordenador } = useWorkflowRelatorioRole()

  const [itens, setItens] = useState<RelatorioHistoricoRow[]>([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [filtroTipo, setFiltroTipo] = useState<string>(TODOS_TIPOS)
  const [busca, setBusca] = useState('')
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null)
  const [aExcluirId, setAExcluirId] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    if (!tenantUserId) {
      setItens([])
      return
    }
    setCarregando(true)
    setErro(null)
    try {
      const lista = await listarHistoricoRelatorios(tenantUserId, 200)
      setItens(lista)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao carregar histórico.'
      setErro(
        msg.includes('relatorios_historico') || msg.includes('schema')
          ? 'Histórico indisponível. Aplique a migração supabase/migrations/20260522120000_relatorios_historico.sql.'
          : msg,
      )
      setItens([])
    } finally {
      setCarregando(false)
    }
  }, [tenantUserId])

  useEffect(() => {
    if (authLoading) return
    void carregar()
  }, [authLoading, carregar])

  const itensFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return itens.filter((item) => {
      if (filtroTipo !== TODOS_TIPOS && item.tipo_relatorio !== filtroTipo) {
        return false
      }
      if (!termo) return true
      const haystack = [
        item.titulo,
        item.local_nome,
        item.competencia,
        ROTULOS_TIPO_RELATORIO[item.tipo_relatorio],
        ROTULOS_STATUS_WORKFLOW[statusWorkflowSeguro(item.status_workflow)],
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(termo)
    })
  }, [busca, filtroTipo, itens])

  const selecionado = useMemo(
    () => itens.find((item) => item.id === selecionadoId) ?? null,
    [itens, selecionadoId],
  )

  const previewDados = useMemo(() => {
    if (!selecionado) return null
    return parseHistoricoParaPreview(selecionado, logoUrl)
  }, [logoUrl, selecionado])

  function aoRelatorioAtualizado(atualizado: RelatorioHistoricoRow) {
    setItens((prev) => prev.map((item) => (item.id === atualizado.id ? atualizado : item)))
  }

  async function aoExcluir(id: string) {
    if (!tenantUserId) return
    const item = itens.find((x) => x.id === id)
    if (item && statusWorkflowSeguro(item.status_workflow) !== 'rascunho') return

    const ok = window.confirm('Remover este registo do histórico?')
    if (!ok) return

    setAExcluirId(id)
    try {
      await excluirHistoricoRelatorio(tenantUserId, id)
      setItens((prev) => prev.filter((x) => x.id !== id))
      if (selecionadoId === id) setSelecionadoId(null)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao excluir registo.')
    } finally {
      setAExcluirId(null)
    }
  }

  function aoImprimir() {
    window.print()
  }

  const podeExcluir = (item: RelatorioHistoricoRow) =>
    isCoordenador && statusWorkflowSeguro(item.status_workflow) === 'rascunho'

  return (
    <div className="mx-auto w-full max-w-7xl">
      <div className="no-print mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary-600" aria-hidden />
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">
              Histórico de Relatórios
            </h1>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Todos os relatórios impressos ou guardados em PDF na{' '}
            <Link to="/relatorios/emissao" className="font-medium text-primary-700 hover:underline">
              emissão de relatórios
            </Link>{' '}
            ficam registados aqui com o conteúdo da altura da impressão.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void carregar()}
          disabled={carregando || !user?.id}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={cn('h-4 w-4', carregando && 'animate-spin')} aria-hidden />
          Atualizar
        </button>
      </div>

      {!user && !authLoading ? (
        <p className="no-print rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
          Inicie sessão para ver o histórico de relatórios.
        </p>
      ) : (
        <>
          <div className="no-print mb-4 flex flex-col gap-3 sm:flex-row">
            <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm font-medium text-slate-700">
              Pesquisar
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden
                />
                <input
                  type="search"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Título, local ou competência…"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 shadow-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                />
              </div>
            </label>

            <label className="flex w-full flex-col gap-1 text-sm font-medium text-slate-700 sm:w-64">
              Tipo
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              >
                <option value={TODOS_TIPOS}>Todos os tipos</option>
                {(Object.keys(ROTULOS_TIPO_RELATORIO) as TipoRelatorioHistorico[]).map(
                  (tipo) => (
                    <option key={tipo} value={tipo}>
                      {ROTULOS_TIPO_RELATORIO[tipo]}
                    </option>
                  ),
                )}
              </select>
            </label>
          </div>

          {erro ? (
            <p role="alert" className="no-print mb-4 text-sm font-medium text-danger-600">
              {erro}
            </p>
          ) : null}

          <div className="no-print overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {carregando ? (
              <div className="flex items-center justify-center gap-2 px-4 py-16 text-sm text-slate-600">
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                A carregar histórico…
              </div>
            ) : itensFiltrados.length === 0 ? (
              <p className="px-4 py-16 text-center text-sm text-slate-500">
                {itens.length === 0
                  ? 'Ainda não há relatórios impressos ou exportados.'
                  : 'Nenhum registo corresponde aos filtros.'}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">
                        Data / hora
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">
                        Tipo
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">
                        Estado
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">
                        Local
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">
                        Competência
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-700">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {itensFiltrados.map((item) => {
                      const activo = item.id === selecionadoId
                      return (
                        <tr
                          key={item.id}
                          className={cn(
                            'transition-colors',
                            activo ? 'bg-primary-50/60' : 'hover:bg-slate-50',
                          )}
                        >
                          <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                            {formatarDataHora(item.impresso_em)}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {ROTULOS_TIPO_RELATORIO[item.tipo_relatorio]}
                          </td>
                          <td className="px-4 py-3">
                            <BadgeStatusWorkflow status={item.status_workflow} />
                          </td>
                          <td className="px-4 py-3 text-slate-700">{item.local_nome}</td>
                          <td className="px-4 py-3 text-slate-700">{item.competencia}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                title="Ver relatório"
                                aria-label="Ver relatório"
                                onClick={() => setSelecionadoId(item.id)}
                                className="rounded p-2 text-slate-500 hover:bg-primary-50 hover:text-primary-700"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              {podeExcluir(item) ? (
                                <button
                                  type="button"
                                  title="Remover do histórico"
                                  aria-label="Remover do histórico"
                                  disabled={aExcluirId === item.id}
                                  onClick={() => void aoExcluir(item.id)}
                                  className="rounded p-2 text-slate-400 hover:bg-danger-50 hover:text-danger-700 disabled:opacity-50"
                                >
                                  {aExcluirId === item.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {selecionado && previewDados && tenantUserId ? (
            <section className="no-print mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-semibold text-slate-900">{selecionado.titulo}</p>
                    <BadgeStatusWorkflow status={selecionado.status_workflow} />
                  </div>
                  <p className="mt-0.5 text-sm text-slate-600">
                    {selecionado.local_nome} · {selecionado.competencia} ·{' '}
                    {formatarDataHora(selecionado.impresso_em)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={aoImprimir}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700"
                  >
                    <Printer className="h-4 w-4" aria-hidden />
                    Imprimir / PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelecionadoId(null)}
                    className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                    aria-label="Fechar pré-visualização"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <RelatorioWorkflowPainel
                relatorio={selecionado}
                tenantUserId={tenantUserId}
                onRelatorioAtualizado={aoRelatorioAtualizado}
              />

              <div className="overflow-x-auto bg-slate-300 p-6">
                <div className="mx-auto flex justify-center">
                  <PreviewRelatorioHistorico dados={previewDados} />
                </div>
              </div>
            </section>
          ) : null}

          {selecionado && previewDados ? (
            <div className="hidden print:block">
              <PreviewRelatorioHistorico dados={previewDados} />
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
