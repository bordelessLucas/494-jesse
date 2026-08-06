import { Loader2, Plus, Save, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { cn } from '../../../lib/cn'
import {
  excluirParametro,
  listarParametros,
  salvarParametro,
} from '../../../lib/configuracao/parametrosDb'
import {
  draftParaPayload,
  novaLinhaDraft,
  rowParaDraft,
  type ParametroDraft,
  type SecaoParametroConfig,
} from '../../../lib/configuracao/parametrosConfig'

type Props = {
  config: SecaoParametroConfig
}

export function ConfigParametrosCrud({ config }: Props) {
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [linhas, setLinhas] = useState<ParametroDraft[]>([])

  const recarregar = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      const lista = await listarParametros(config.slug)
      setLinhas(lista.map((row) => rowParaDraft(row, config)))
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar registos.')
    } finally {
      setCarregando(false)
    }
  }, [config])

  useEffect(() => {
    void recarregar()
  }, [recarregar])

  async function salvar(row: ParametroDraft) {
    for (const campo of config.campos) {
      if (campo.required && !String(row.valores[campo.key] ?? '').trim()) {
        setErro(`Informe ${campo.label.toLowerCase()}.`)
        return
      }
    }

    setLinhas((prev) => prev.map((r) => (r.key === row.key ? { ...r, saving: true } : r)))
    setErro(null)
    try {
      const saved = await salvarParametro(config.slug, {
        id: row.id,
        payload: draftParaPayload(row, config),
      })
      setLinhas((prev) =>
        prev.map((r) => (r.key === row.key ? rowParaDraft(saved, config) : r)),
      )
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao guardar.')
    } finally {
      setLinhas((prev) => prev.map((r) => (r.key === row.key ? { ...r, saving: false } : r)))
    }
  }

  async function remover(row: ParametroDraft) {
    const nome =
      String(row.valores.nome ?? row.valores.rotulo ?? row.valores.codigo ?? 'este registo')
    if (row.id) {
      if (!window.confirm(`Remover «${nome}»?`)) return
      setErro(null)
      try {
        await excluirParametro(config.slug, row.id)
      } catch (e) {
        setErro(e instanceof Error ? e.message : 'Erro ao remover.')
        return
      }
    }
    setLinhas((prev) => prev.filter((r) => r.key !== row.key))
  }

  function atualizarValor(rowKey: string, campoKey: string, valor: string | boolean) {
    setLinhas((prev) =>
      prev.map((r) =>
        r.key === rowKey ? { ...r, valores: { ...r.valores, [campoKey]: valor } } : r,
      ),
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-2xl text-sm text-slate-600">{config.descricao}</p>
        <button
          type="button"
          onClick={() => setLinhas((prev) => [...prev, novaLinhaDraft(config)])}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Adicionar
        </button>
      </div>

      {erro ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {erro}
        </div>
      ) : null}

      <div className="overflow-hidden ug-card shadow-sm">
        {carregando ? (
          <div className="flex min-h-[180px] items-center justify-center text-slate-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            A carregar…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  {config.campos.map((campo) => (
                    <th key={campo.key} className="px-4 py-3 font-medium">
                      {campo.label}
                    </th>
                  ))}
                  <th className="px-4 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {linhas.length === 0 ? (
                  <tr>
                    <td
                      colSpan={config.campos.length + 1}
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      Nenhum registo cadastrado.
                    </td>
                  </tr>
                ) : (
                  linhas.map((row) => (
                    <tr key={row.key} className="border-b border-slate-100">
                      {config.campos.map((campo) => (
                        <td key={campo.key} className="px-4 py-3">
                          {campo.type === 'boolean' ? (
                            <input
                              type="checkbox"
                              checked={Boolean(row.valores[campo.key])}
                              onChange={(e) =>
                                atualizarValor(row.key, campo.key, e.target.checked)
                              }
                            />
                          ) : campo.type === 'color' ? (
                            <input
                              type="color"
                              className="h-9 w-14 cursor-pointer rounded border border-slate-300"
                              value={String(row.valores[campo.key] || '#64748b')}
                              onChange={(e) =>
                                atualizarValor(row.key, campo.key, e.target.value)
                              }
                            />
                          ) : (
                            <input
                              className={cn(
                                'rounded-lg border border-slate-300 px-3 py-2',
                                campo.minWidth ?? 'min-w-[120px]',
                                campo.type === 'number' && 'tabular-nums',
                              )}
                              type={campo.type === 'number' ? 'text' : campo.type === 'time' ? 'time' : 'text'}
                              value={String(row.valores[campo.key] ?? '')}
                              placeholder={campo.placeholder}
                              onChange={(e) =>
                                atualizarValor(row.key, campo.key, e.target.value)
                              }
                            />
                          )}
                        </td>
                      ))}
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
