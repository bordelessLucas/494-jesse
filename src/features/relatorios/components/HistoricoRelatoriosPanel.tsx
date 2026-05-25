import { History, Loader2, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  excluirHistoricoRelatorio,
  listarHistoricoRelatorios,
  type RelatorioHistoricoRow,
} from '../../../lib/relatorios/relatoriosHistoricoDb'

type HistoricoRelatoriosPanelProps = {
  userId: string | undefined
  /** Incrementar após cada impressão para recarregar a lista. */
  versaoLista: number
}

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

export function HistoricoRelatoriosPanel({
  userId,
  versaoLista,
}: HistoricoRelatoriosPanelProps) {
  const [itens, setItens] = useState<RelatorioHistoricoRow[]>([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [aExcluirId, setAExcluirId] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    if (!userId) {
      setItens([])
      return
    }
    setCarregando(true)
    setErro(null)
    try {
      const lista = await listarHistoricoRelatorios(userId)
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
  }, [userId])

  useEffect(() => {
    void carregar()
  }, [carregar, versaoLista])

  async function aoExcluir(id: string) {
    if (!userId) return
    setAExcluirId(id)
    try {
      await excluirHistoricoRelatorio(userId, id)
      setItens((prev) => prev.filter((x) => x.id !== id))
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao excluir registo.')
    } finally {
      setAExcluirId(null)
    }
  }

  if (!userId) {
    return (
      <p className="text-xs text-slate-500">
        Inicie sessão para ver o histórico de relatórios impressos.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-slate-500" aria-hidden />
          <h2 className="text-sm font-semibold text-slate-900">Histórico de impressões</h2>
        </div>
        <Link
          to="/relatorios/historico"
          className="text-xs font-semibold text-primary-700 hover:underline"
        >
          Ver todos
        </Link>
      </div>
      <p className="text-xs text-slate-500">
        Cada «Imprimir / Salvar PDF» fica registado aqui com tipo, local e competência.
      </p>

      {erro ? (
        <p role="alert" className="text-xs font-medium text-danger-600">
          {erro}
        </p>
      ) : null}

      {carregando ? (
        <div className="flex items-center gap-2 py-3 text-xs text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          A carregar…
        </div>
      ) : itens.length === 0 ? (
        <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center text-xs text-slate-500">
          Ainda não há relatórios impressos.
        </p>
      ) : (
        <ul className="max-h-52 space-y-2 overflow-y-auto pr-1">
          {itens.map((item) => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-900">{item.titulo}</p>
                <p className="mt-0.5 text-slate-600">
                  {item.local_nome} · {item.competencia}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {formatarDataHora(item.impresso_em)}
                </p>
              </div>
              <button
                type="button"
                title="Remover do histórico"
                aria-label="Remover do histórico"
                disabled={aExcluirId === item.id}
                onClick={() => void aoExcluir(item.id)}
                className="shrink-0 rounded p-1 text-slate-400 hover:bg-danger-50 hover:text-danger-700 disabled:opacity-50"
              >
                {aExcluirId === item.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
