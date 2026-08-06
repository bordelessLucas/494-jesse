import { Loader2, Plus, Save, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { useCatalogoLocaisSetores } from '../../../hooks/useCatalogoLocaisSetores'
import {
  buscarConfigTipoServico,
  desvincularSetorTipoServico,
  excluirAcrescimoTipoServico,
  salvarAcrescimoTipoServico,
  salvarTipoServicoGestao,
  vincularSetorTipoServico,
} from '../../../lib/gestao/tipoServicoDb'
import type {
  AcrescimoTipoServicoGestao,
  SlugTipoServicoGestao,
  TipoCalculoAcrescimoGestao,
} from '../../../lib/gestao/tipoServicoTypes'
import { ROTULOS_TIPO_SERVICO, TIPO_CALCULO_OPCOES } from '../../../lib/gestao/tipoServicoTypes'

type AcrescimoDraft = {
  key: string
  id?: string
  especialidade: string
  tipo_calculo: TipoCalculoAcrescimoGestao
  valor: string
  ativo: boolean
  ordem: string
  saving?: boolean
}

function acrescimoToDraft(a: AcrescimoTipoServicoGestao): AcrescimoDraft {
  return {
    key: a.id,
    id: a.id,
    especialidade: a.especialidade,
    tipo_calculo: a.tipo_calculo,
    valor: String(a.valor),
    ativo: a.ativo,
    ordem: String(a.ordem),
  }
}

function novaLinhaAcrescimo(): AcrescimoDraft {
  return {
    key: `new-${crypto.randomUUID()}`,
    especialidade: '',
    tipo_calculo: 'percentual',
    valor: '0',
    ativo: true,
    ordem: '0',
  }
}

type TipoServicoGestaoPageProps = {
  slug: SlugTipoServicoGestao
}

export function TipoServicoGestaoPage({ slug }: TipoServicoGestaoPageProps) {
  const { locais, setoresPorLocalId } = useCatalogoLocaisSetores()
  const tituloServico = ROTULOS_TIPO_SERVICO[slug]

  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [tipoId, setTipoId] = useState('')
  const [titulo, setTitulo] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [ativo, setAtivo] = useState(true)
  const [salvandoGeral, setSalvandoGeral] = useState(false)
  const [acrescimos, setAcrescimos] = useState<AcrescimoDraft[]>([])
  const [setoresVinculados, setSetoresVinculados] = useState<
    { id: string; setor_id: string; setorNome?: string; localNome?: string }[]
  >([])
  const [setorParaVincular, setSetorParaVincular] = useState('')
  const [vinculandoSetor, setVinculandoSetor] = useState(false)

  const opcoesSetores = useMemo(() => {
    const items: { id: string; label: string; localNome: string; setorNome: string }[] = []
    for (const local of locais) {
      const setores = setoresPorLocalId[local.id] ?? []
      for (const setor of setores) {
        items.push({
          id: setor.id,
          label: `${local.nome} · ${setor.nome}`,
          localNome: local.nome,
          setorNome: setor.nome,
        })
      }
    }
    return items
  }, [locais, setoresPorLocalId])

  const rotuloSetor = useCallback(
    (setorId: string) => {
      const item = opcoesSetores.find((o) => o.id === setorId)
      return item ? { setorNome: item.setorNome, localNome: item.localNome } : null
    },
    [opcoesSetores],
  )

  const recarregar = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      const config = await buscarConfigTipoServico(slug)
      setTipoId(config.tipo.id)
      setTitulo(config.tipo.titulo)
      setObservacoes(config.tipo.observacoes ?? '')
      setAtivo(config.tipo.ativo)
      setAcrescimos(config.acrescimos.map(acrescimoToDraft))
      setSetoresVinculados(
        config.setores.map((s) => {
          const rotulo = opcoesSetores.find((o) => o.id === s.setor_id)
          return {
            id: s.id,
            setor_id: s.setor_id,
            setorNome: rotulo?.setorNome ?? s.setorNome,
            localNome: rotulo?.localNome ?? s.localNome,
          }
        }),
      )
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível carregar a configuração.')
    } finally {
      setCarregando(false)
    }
  }, [slug, opcoesSetores])

  useEffect(() => {
    void recarregar()
  }, [recarregar])

  async function salvarGeral() {
    if (!tipoId) return
    setSalvandoGeral(true)
    setErro(null)
    try {
      await salvarTipoServicoGestao({
        id: tipoId,
        titulo: titulo || tituloServico,
        observacoes,
        ativo,
      })
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao guardar.')
    } finally {
      setSalvandoGeral(false)
    }
  }

  async function salvarAcrescimo(row: AcrescimoDraft) {
    if (!tipoId || !row.especialidade.trim()) {
      setErro('Informe a especialidade do acréscimo.')
      return
    }
    setAcrescimos((prev) =>
      prev.map((r) => (r.key === row.key ? { ...r, saving: true } : r)),
    )
    setErro(null)
    try {
      const saved = await salvarAcrescimoTipoServico({
        id: row.id,
        tipo_servico_id: tipoId,
        especialidade: row.especialidade,
        tipo_calculo: row.tipo_calculo,
        valor: Number(row.valor.replace(',', '.')) || 0,
        ativo: row.ativo,
        ordem: Number(row.ordem) || 0,
      })
      setAcrescimos((prev) =>
        prev.map((r) => (r.key === row.key ? acrescimoToDraft(saved) : r)),
      )
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao guardar acréscimo.')
    } finally {
      setAcrescimos((prev) =>
        prev.map((r) => (r.key === row.key ? { ...r, saving: false } : r)),
      )
    }
  }

  async function removerAcrescimo(row: AcrescimoDraft) {
    if (row.id) {
      if (!window.confirm('Remover este acréscimo?')) return
      setErro(null)
      try {
        await excluirAcrescimoTipoServico(row.id)
      } catch (e) {
        setErro(e instanceof Error ? e.message : 'Erro ao remover acréscimo.')
        return
      }
    }
    setAcrescimos((prev) => prev.filter((r) => r.key !== row.key))
  }

  async function vincularSetor() {
    if (!tipoId || !setorParaVincular) return
    setVinculandoSetor(true)
    setErro(null)
    try {
      const vinculo = await vincularSetorTipoServico({
        tipo_servico_id: tipoId,
        setor_id: setorParaVincular,
      })
      const rotulo = rotuloSetor(vinculo.setor_id)
      setSetoresVinculados((prev) => [
        ...prev,
        {
          id: vinculo.id,
          setor_id: vinculo.setor_id,
          setorNome: rotulo?.setorNome,
          localNome: rotulo?.localNome,
        },
      ])
      setSetorParaVincular('')
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao vincular setor.')
    } finally {
      setVinculandoSetor(false)
    }
  }

  async function removerSetor(vinculoId: string) {
    if (!window.confirm('Desvincular este setor?')) return
    setErro(null)
    try {
      await desvincularSetorTipoServico(vinculoId)
      setSetoresVinculados((prev) => prev.filter((s) => s.id !== vinculoId))
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao desvincular setor.')
    }
  }

  if (carregando) {
    return (
      <div className="flex min-h-[240px] items-center justify-center text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden />
        A carregar…
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-10">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Cadastros (Gestão) — Tipo de Serviço
        </p>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">{tituloServico}</h1>
        <p className="mt-1 text-sm text-slate-600">
          Regras de acréscimos por especialidade e setores hospitalares vinculados.
        </p>
      </div>

      {erro ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {erro}
        </div>
      ) : null}

      <section className="ug-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Configuração geral</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Título</span>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </label>
          <label className="flex items-center gap-2 text-sm sm:mt-6">
            <input
              type="checkbox"
              checked={ativo}
              onChange={(e) => setAtivo(e.target.checked)}
              className="rounded border-slate-300"
            />
            <span className="font-medium text-slate-700">Serviço ativo</span>
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="font-medium text-slate-700">Observações</span>
            <textarea
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              rows={2}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </label>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => void salvarGeral()}
            disabled={salvandoGeral}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
          >
            {salvandoGeral ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar
          </button>
        </div>
      </section>

      <section className="ug-card p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-900">Acréscimos por especialidade</h2>
          <button
            type="button"
            onClick={() => setAcrescimos((prev) => [...prev, novaLinhaAcrescimo()])}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar regra
          </button>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <th className="px-2 py-2">Especialidade</th>
                <th className="px-2 py-2">Cálculo</th>
                <th className="px-2 py-2">Valor</th>
                <th className="px-2 py-2">Ordem</th>
                <th className="px-2 py-2">Ativo</th>
                <th className="px-2 py-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {acrescimos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-2 py-6 text-center text-slate-500">
                    Nenhuma regra cadastrada.
                  </td>
                </tr>
              ) : (
                acrescimos.map((row) => (
                  <tr key={row.key} className="border-b border-slate-100">
                    <td className="px-2 py-2">
                      <input
                        className="w-full min-w-[140px] rounded border border-slate-300 px-2 py-1"
                        value={row.especialidade}
                        onChange={(e) =>
                          setAcrescimos((prev) =>
                            prev.map((r) =>
                              r.key === row.key ? { ...r, especialidade: e.target.value } : r,
                            ),
                          )
                        }
                        placeholder="Ex.: Infectologia"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <select
                        className="rounded border border-slate-300 px-2 py-1"
                        value={row.tipo_calculo}
                        onChange={(e) =>
                          setAcrescimos((prev) =>
                            prev.map((r) =>
                              r.key === row.key
                                ? { ...r, tipo_calculo: e.target.value as TipoCalculoAcrescimoGestao }
                                : r,
                            ),
                          )
                        }
                      >
                        {TIPO_CALCULO_OPCOES.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <input
                        className="w-24 rounded border border-slate-300 px-2 py-1"
                        value={row.valor}
                        onChange={(e) =>
                          setAcrescimos((prev) =>
                            prev.map((r) =>
                              r.key === row.key ? { ...r, valor: e.target.value } : r,
                            ),
                          )
                        }
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        className="w-16 rounded border border-slate-300 px-2 py-1"
                        value={row.ordem}
                        onChange={(e) =>
                          setAcrescimos((prev) =>
                            prev.map((r) =>
                              r.key === row.key ? { ...r, ordem: e.target.value } : r,
                            ),
                          )
                        }
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="checkbox"
                        checked={row.ativo}
                        onChange={(e) =>
                          setAcrescimos((prev) =>
                            prev.map((r) =>
                              r.key === row.key ? { ...r, ativo: e.target.checked } : r,
                            ),
                          )
                        }
                      />
                    </td>
                    <td className="px-2 py-2 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => void salvarAcrescimo(row)}
                          disabled={row.saving}
                          className="rounded p-1.5 text-blue-600 hover:bg-primary-50"
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
                          onClick={() => void removerAcrescimo(row)}
                          className="rounded p-1.5 text-red-600 hover:bg-red-50"
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
      </section>

      <section className="ug-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Setores hospitalares vinculados</h2>
        <div className="mt-4 flex flex-wrap items-end gap-2">
          <label className="block min-w-[240px] flex-1 text-sm">
            <span className="font-medium text-slate-700">Setor</span>
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={setorParaVincular}
              onChange={(e) => setSetorParaVincular(e.target.value)}
            >
              <option value="">Selecione…</option>
              {opcoesSetores.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => void vincularSetor()}
            disabled={!setorParaVincular || vinculandoSetor}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-60"
          >
            {vinculandoSetor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Vincular
          </button>
        </div>
        <ul className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-200">
          {setoresVinculados.length === 0 ? (
            <li className="px-4 py-6 text-center text-sm text-slate-500">Nenhum setor vinculado.</li>
          ) : (
            setoresVinculados.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <div>
                  <span className="font-medium text-slate-900">{s.setorNome ?? 'Setor'}</span>
                  {s.localNome ? (
                    <span className="ml-2 text-slate-500">({s.localNome})</span>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => void removerSetor(s.id)}
                  className="rounded p-1.5 text-red-600 hover:bg-red-50"
                  title="Desvincular"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  )
}
