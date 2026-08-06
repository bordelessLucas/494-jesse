import { Loader2, Plus, Save, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { cn } from '../../lib/cn'
import {
  excluirEspecialidade,
  listarEspecialidades,
  salvarEspecialidade,
} from '../../lib/especialidades/especialidadesDb'
import type { ConselhoClasseEspecialidade, EspecialidadeRow } from '../../lib/especialidades/especialidadesTypes'
import { CONSELHO_CLASSE_OPCOES } from '../../lib/especialidades/especialidadesTypes'

type EspecialidadeDraft = {
  key: string
  id?: string
  nome: string
  conselho_classe: ConselhoClasseEspecialidade
  valor_base_hora: string
  ativo: boolean
  saving?: boolean
}

function rowToDraft(row: EspecialidadeRow): EspecialidadeDraft {
  return {
    key: row.id,
    id: row.id,
    nome: row.nome,
    conselho_classe: row.conselho_classe,
    valor_base_hora: String(row.valor_base_hora),
    ativo: row.ativo,
  }
}

function novaLinha(): EspecialidadeDraft {
  return {
    key: `new-${crypto.randomUUID()}`,
    nome: '',
    conselho_classe: 'CRM',
    valor_base_hora: '0',
    ativo: true,
  }
}

export function EspecialidadesPage() {
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [linhas, setLinhas] = useState<EspecialidadeDraft[]>([])

  const recarregar = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      const lista = await listarEspecialidades()
      setLinhas(lista.map(rowToDraft))
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar especialidades.')
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    void recarregar()
  }, [recarregar])

  async function salvar(row: EspecialidadeDraft) {
    if (!row.nome.trim()) {
      setErro('Informe o nome da especialidade.')
      return
    }
    setLinhas((prev) => prev.map((r) => (r.key === row.key ? { ...r, saving: true } : r)))
    setErro(null)
    try {
      const saved = await salvarEspecialidade({
        id: row.id,
        nome: row.nome,
        conselho_classe: row.conselho_classe,
        valor_base_hora: Number(row.valor_base_hora.replace(',', '.')) || 0,
        ativo: row.ativo,
      })
      setLinhas((prev) => prev.map((r) => (r.key === row.key ? rowToDraft(saved) : r)))
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao guardar.')
    } finally {
      setLinhas((prev) => prev.map((r) => (r.key === row.key ? { ...r, saving: false } : r)))
    }
  }

  async function remover(row: EspecialidadeDraft) {
    if (row.id) {
      if (!window.confirm(`Remover a especialidade «${row.nome}»?`)) return
      setErro(null)
      try {
        await excluirEspecialidade(row.id)
      } catch (e) {
        setErro(e instanceof Error ? e.message : 'Erro ao remover.')
        return
      }
    }
    setLinhas((prev) => prev.filter((r) => r.key !== row.key))
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Cadastros & Equipe
          </p>
          <h1 className="mt-1 text-xl font-semibold text-slate-900">Especialidades</h1>
          <p className="mt-1 text-sm text-slate-600">
            Catálogo isolado com conselho de classe e valor base hora para cálculo de remuneração.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setLinhas((prev) => [...prev, novaLinha()])}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Nova especialidade
        </button>
      </div>

      {erro ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {erro}
        </div>
      ) : null}

      <div className="overflow-hidden ug-card shadow-sm">
        {carregando ? (
          <div className="flex min-h-[200px] items-center justify-center text-slate-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            A carregar…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">Conselho</th>
                  <th className="px-4 py-3 font-medium">Valor base / hora (R$)</th>
                  <th className="px-4 py-3 font-medium">Ativo</th>
                  <th className="px-4 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {linhas.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                      Nenhuma especialidade cadastrada.
                    </td>
                  </tr>
                ) : (
                  linhas.map((row) => (
                    <tr key={row.key} className="border-b border-slate-100">
                      <td className="px-4 py-3">
                        <input
                          className="w-full min-w-[160px] rounded-lg border border-slate-300 px-3 py-2"
                          value={row.nome}
                          onChange={(e) =>
                            setLinhas((prev) =>
                              prev.map((r) =>
                                r.key === row.key ? { ...r, nome: e.target.value } : r,
                              ),
                            )
                          }
                          placeholder="Ex.: Infectologia"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          className="rounded-lg border border-slate-300 px-3 py-2"
                          value={row.conselho_classe}
                          onChange={(e) =>
                            setLinhas((prev) =>
                              prev.map((r) =>
                                r.key === row.key
                                  ? {
                                      ...r,
                                      conselho_classe: e.target.value as ConselhoClasseEspecialidade,
                                    }
                                  : r,
                              ),
                            )
                          }
                        >
                          {CONSELHO_CLASSE_OPCOES.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.value}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          className="w-28 rounded-lg border border-slate-300 px-3 py-2 tabular-nums"
                          value={row.valor_base_hora}
                          onChange={(e) =>
                            setLinhas((prev) =>
                              prev.map((r) =>
                                r.key === row.key ? { ...r, valor_base_hora: e.target.value } : r,
                              ),
                            )
                          }
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={row.ativo}
                          onChange={(e) =>
                            setLinhas((prev) =>
                              prev.map((r) =>
                                r.key === row.key ? { ...r, ativo: e.target.checked } : r,
                              ),
                            )
                          }
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => void salvar(row)}
                            disabled={row.saving}
                            className={cn(
                              'rounded-lg p-2 text-blue-600 hover:bg-primary-50',
                              row.saving && 'opacity-60',
                            )}
                            title="Guardar"
                          >
                            {row.saving ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => void remover(row)}
                            className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                            title="Remover"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
