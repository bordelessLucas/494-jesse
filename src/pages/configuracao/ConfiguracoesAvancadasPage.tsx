import { ChevronLeft, Loader2, Plus, Save, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { cn } from '../../lib/cn'
import {
  buscarRegrasRemuneracao,
  excluirAcrescimoRemuneracao,
  excluirFeriadoRemuneracao,
  excluirTipoPlantaoRemuneracao,
  salvarAcrescimoRemuneracao,
  salvarFeriadoRemuneracao,
  salvarTipoPlantaoRemuneracao,
} from '../../lib/financeiro/remuneracaoDb'
import type {
  AcrescimoRemuneracao,
  FeriadoRemuneracao,
  GatilhoAcrescimo,
  TipoCalculoAcrescimo,
  TipoPlantaoRemuneracao,
} from '../../lib/financeiro/remuneracaoTypes'

const GATILHO_OPCOES: { value: GatilhoAcrescimo; label: string }[] = [
  { value: 'fim_de_semana', label: 'Fim de semana' },
  { value: 'feriado', label: 'Feriado (datas cadastradas)' },
  { value: 'especialidade', label: 'Especialidade do profissional' },
]

const TIPO_CALCULO_OPCOES: { value: TipoCalculoAcrescimo; label: string }[] = [
  { value: 'percentual', label: 'Percentual (%)' },
  { value: 'valor_fixo_hora', label: 'Valor fixo por hora (R$)' },
  { value: 'valor_fixo_plantao', label: 'Valor fixo por plantão (R$)' },
]

type TipoDraft = {
  key: string
  id?: string
  nome: string
  descricao: string
  multiplicadorPct: string
  ativo: boolean
  ordem: string
  saving?: boolean
}

type AcrescimoDraft = {
  key: string
  id?: string
  nome: string
  tipo_calculo: TipoCalculoAcrescimo
  valor: string
  gatilho: GatilhoAcrescimo
  especialidade_contem: string
  ativo: boolean
  ordem: string
  saving?: boolean
}

type FeriadoDraft = {
  key: string
  id?: string
  data_feriado: string
  nome: string
  saving?: boolean
}

function pctFromMult(mult: number): string {
  return String(Math.round((mult - 1) * 100))
}

function multFromPct(pct: string): number {
  const n = Number(pct.replace(',', '.'))
  if (!Number.isFinite(n)) return 1
  return 1 + n / 100
}

function tipoToDraft(t: TipoPlantaoRemuneracao): TipoDraft {
  return {
    key: t.id,
    id: t.id,
    nome: t.nome,
    descricao: t.descricao ?? '',
    multiplicadorPct: pctFromMult(Number(t.multiplicador)),
    ativo: t.ativo,
    ordem: String(t.ordem),
  }
}

function acrescimoToDraft(a: AcrescimoRemuneracao): AcrescimoDraft {
  return {
    key: a.id,
    id: a.id,
    nome: a.nome,
    tipo_calculo: a.tipo_calculo,
    valor: String(a.valor),
    gatilho: a.gatilho,
    especialidade_contem: a.especialidade_contem ?? '',
    ativo: a.ativo,
    ordem: String(a.ordem),
  }
}

function feriadoToDraft(f: FeriadoRemuneracao): FeriadoDraft {
  return {
    key: f.id,
    id: f.id,
    data_feriado: f.data_feriado,
    nome: f.nome,
  }
}

function novaLinhaTipo(): TipoDraft {
  return {
    key: `new-${crypto.randomUUID()}`,
    nome: '',
    descricao: '',
    multiplicadorPct: '0',
    ativo: true,
    ordem: '0',
  }
}

function novaLinhaAcrescimo(): AcrescimoDraft {
  return {
    key: `new-${crypto.randomUUID()}`,
    nome: '',
    tipo_calculo: 'percentual',
    valor: '20',
    gatilho: 'fim_de_semana',
    especialidade_contem: '',
    ativo: true,
    ordem: '0',
  }
}

function novaLinhaFeriado(): FeriadoDraft {
  return {
    key: `new-${crypto.randomUUID()}`,
    data_feriado: '',
    nome: 'Feriado',
  }
}

export function ConfiguracoesAvancadasPage() {
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [tipos, setTipos] = useState<TipoDraft[]>([])
  const [acrescimos, setAcrescimos] = useState<AcrescimoDraft[]>([])
  const [feriados, setFeriados] = useState<FeriadoDraft[]>([])

  const recarregar = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      const regras = await buscarRegrasRemuneracao()
      setTipos(regras.tiposPlantao.map(tipoToDraft))
      setAcrescimos(regras.acrescimos.map(acrescimoToDraft))
      setFeriados(regras.feriados.map(feriadoToDraft))
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível carregar as regras.')
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    void recarregar()
  }, [recarregar])

  async function salvarTipo(row: TipoDraft) {
    if (!row.nome.trim()) {
      setErro('Informe o nome do tipo de plantão.')
      return
    }
    setTipos((prev) =>
      prev.map((r) => (r.key === row.key ? { ...r, saving: true } : r)),
    )
    setErro(null)
    try {
      const saved = await salvarTipoPlantaoRemuneracao({
        id: row.id,
        nome: row.nome,
        descricao: row.descricao || null,
        multiplicador: multFromPct(row.multiplicadorPct),
        ativo: row.ativo,
        ordem: Number(row.ordem) || 0,
      })
      setTipos((prev) =>
        prev.map((r) => (r.key === row.key ? tipoToDraft(saved) : r)),
      )
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao guardar tipo.')
    } finally {
      setTipos((prev) =>
        prev.map((r) => (r.key === row.key ? { ...r, saving: false } : r)),
      )
    }
  }

  async function removerTipo(row: TipoDraft) {
    if (!row.id) {
      setTipos((prev) => prev.filter((r) => r.key !== row.key))
      return
    }
    if (!window.confirm(`Remover o tipo «${row.nome}»?`)) return
    try {
      await excluirTipoPlantaoRemuneracao(row.id)
      setTipos((prev) => prev.filter((r) => r.key !== row.key))
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao remover tipo.')
    }
  }

  async function salvarAcrescimo(row: AcrescimoDraft) {
    if (!row.nome.trim()) {
      setErro('Informe o nome do acréscimo.')
      return
    }
    if (row.gatilho === 'especialidade' && !row.especialidade_contem.trim()) {
      setErro('Informe o texto da especialidade para o gatilho.')
      return
    }
    setAcrescimos((prev) =>
      prev.map((r) => (r.key === row.key ? { ...r, saving: true } : r)),
    )
    setErro(null)
    try {
      const saved = await salvarAcrescimoRemuneracao({
        id: row.id,
        nome: row.nome,
        tipo_calculo: row.tipo_calculo,
        valor: Number(row.valor.replace(',', '.')) || 0,
        gatilho: row.gatilho,
        especialidade_contem:
          row.gatilho === 'especialidade' ? row.especialidade_contem : null,
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
    if (!row.id) {
      setAcrescimos((prev) => prev.filter((r) => r.key !== row.key))
      return
    }
    if (!window.confirm(`Remover o acréscimo «${row.nome}»?`)) return
    try {
      await excluirAcrescimoRemuneracao(row.id)
      setAcrescimos((prev) => prev.filter((r) => r.key !== row.key))
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao remover acréscimo.')
    }
  }

  async function salvarFeriado(row: FeriadoDraft) {
    if (!row.data_feriado) {
      setErro('Informe a data do feriado.')
      return
    }
    setFeriados((prev) =>
      prev.map((r) => (r.key === row.key ? { ...r, saving: true } : r)),
    )
    setErro(null)
    try {
      const saved = await salvarFeriadoRemuneracao({
        id: row.id,
        data_feriado: row.data_feriado,
        nome: row.nome,
      })
      setFeriados((prev) =>
        prev.map((r) => (r.key === row.key ? feriadoToDraft(saved) : r)),
      )
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao guardar feriado.')
    } finally {
      setFeriados((prev) =>
        prev.map((r) => (r.key === row.key ? { ...r, saving: false } : r)),
      )
    }
  }

  async function removerFeriado(row: FeriadoDraft) {
    if (!row.id) {
      setFeriados((prev) => prev.filter((r) => r.key !== row.key))
      return
    }
    if (!window.confirm(`Remover o feriado «${row.nome}»?`)) return
    try {
      await excluirFeriadoRemuneracao(row.id)
      setFeriados((prev) => prev.filter((r) => r.key !== row.key))
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao remover feriado.')
    }
  }

  const inputCls =
    'w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6">
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
        <Link
          to="/configuracao"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Configurações
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-slate-900">
          Configurações avançadas
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Motor de remuneração: defina multiplicadores por tipo de plantão e acréscimos
          automáticos (fim de semana, feriados cadastrados ou especialidade). O valor bruto
          no extrato financeiro é recalculado com base nestas regras.
        </p>
      </div>

      {erro ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {erro}
        </p>
      ) : null}

      {carregando ? (
        <div className="flex items-center justify-center gap-2 py-20 text-slate-600">
          <Loader2 className="h-6 w-6 animate-spin" /> A carregar regras…
        </div>
      ) : (
        <>
          <div className="overflow-hidden ug-card shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-6">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Tipos de plantão</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Multiplicador sobre o valor base (ex.: +20% = campo 20).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTipos((p) => [...p, novaLinhaTipo()])}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Plus className="h-4 w-4" /> Adicionar tipo
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-600">
                    <th className="px-4 py-3">Nome</th>
                    <th className="px-4 py-3">Descrição</th>
                    <th className="px-4 py-3 text-right">+ % base</th>
                    <th className="px-4 py-3 text-center">Ativo</th>
                    <th className="px-4 py-3 text-right">Ordem</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {tipos.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        Nenhum tipo cadastrado. Ex.: Plantão noturno (+15%).
                      </td>
                    </tr>
                  ) : (
                    tipos.map((row) => (
                      <tr key={row.key} className="border-b border-slate-50 last:border-0">
                        <td className="px-4 py-2">
                          <input
                            className={inputCls}
                            value={row.nome}
                            onChange={(e) =>
                              setTipos((p) =>
                                p.map((r) =>
                                  r.key === row.key ? { ...r, nome: e.target.value } : r,
                                ),
                              )
                            }
                            placeholder="Ex.: Noturno"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            className={inputCls}
                            value={row.descricao}
                            onChange={(e) =>
                              setTipos((p) =>
                                p.map((r) =>
                                  r.key === row.key
                                    ? { ...r, descricao: e.target.value }
                                    : r,
                                ),
                              )
                            }
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            className={cn(inputCls, 'text-right tabular-nums')}
                            value={row.multiplicadorPct}
                            onChange={(e) =>
                              setTipos((p) =>
                                p.map((r) =>
                                  r.key === row.key
                                    ? { ...r, multiplicadorPct: e.target.value }
                                    : r,
                                ),
                              )
                            }
                          />
                        </td>
                        <td className="px-4 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={row.ativo}
                            onChange={(e) =>
                              setTipos((p) =>
                                p.map((r) =>
                                  r.key === row.key ? { ...r, ativo: e.target.checked } : r,
                                ),
                              )
                            }
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            className={cn(inputCls, 'w-16 text-right')}
                            value={row.ordem}
                            onChange={(e) =>
                              setTipos((p) =>
                                p.map((r) =>
                                  r.key === row.key ? { ...r, ordem: e.target.value } : r,
                                ),
                              )
                            }
                          />
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              disabled={row.saving}
                              onClick={() => void salvarTipo(row)}
                              className="rounded-md p-2 text-primary-700 hover:bg-primary-50"
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
                              onClick={() => void removerTipo(row)}
                              className="rounded-md p-2 text-red-600 hover:bg-red-50"
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
          </div>

          <div className="overflow-hidden ug-card shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-6">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Acréscimos</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Ex.: Fim de semana +20%, Feriado +50%, Especialidade +R$/hora.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAcrescimos((p) => [...p, novaLinhaAcrescimo()])}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Plus className="h-4 w-4" /> Adicionar acréscimo
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[56rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-600">
                    <th className="px-4 py-3">Nome</th>
                    <th className="px-4 py-3">Gatilho</th>
                    <th className="px-4 py-3">Cálculo</th>
                    <th className="px-4 py-3 text-right">Valor</th>
                    <th className="px-4 py-3">Especialidade contém</th>
                    <th className="px-4 py-3 text-center">Ativo</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {acrescimos.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                        Nenhum acréscimo. Sugestão: «Fim de semana» com +20% e gatilho fim de
                        semana.
                      </td>
                    </tr>
                  ) : (
                    acrescimos.map((row) => (
                      <tr key={row.key} className="border-b border-slate-50 last:border-0">
                        <td className="px-4 py-2">
                          <input
                            className={inputCls}
                            value={row.nome}
                            onChange={(e) =>
                              setAcrescimos((p) =>
                                p.map((r) =>
                                  r.key === row.key ? { ...r, nome: e.target.value } : r,
                                ),
                              )
                            }
                            placeholder="Ex.: Fim de semana"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <select
                            className={inputCls}
                            value={row.gatilho}
                            onChange={(e) =>
                              setAcrescimos((p) =>
                                p.map((r) =>
                                  r.key === row.key
                                    ? {
                                        ...r,
                                        gatilho: e.target.value as GatilhoAcrescimo,
                                      }
                                    : r,
                                ),
                              )
                            }
                          >
                            {GATILHO_OPCOES.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          <select
                            className={inputCls}
                            value={row.tipo_calculo}
                            onChange={(e) =>
                              setAcrescimos((p) =>
                                p.map((r) =>
                                  r.key === row.key
                                    ? {
                                        ...r,
                                        tipo_calculo: e.target
                                          .value as TipoCalculoAcrescimo,
                                      }
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
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            step="0.01"
                            className={cn(inputCls, 'w-24 text-right tabular-nums')}
                            value={row.valor}
                            onChange={(e) =>
                              setAcrescimos((p) =>
                                p.map((r) =>
                                  r.key === row.key ? { ...r, valor: e.target.value } : r,
                                ),
                              )
                            }
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            className={inputCls}
                            disabled={row.gatilho !== 'especialidade'}
                            value={row.especialidade_contem}
                            onChange={(e) =>
                              setAcrescimos((p) =>
                                p.map((r) =>
                                  r.key === row.key
                                    ? { ...r, especialidade_contem: e.target.value }
                                    : r,
                                ),
                              )
                            }
                            placeholder="Ex.: Cardiologia"
                          />
                        </td>
                        <td className="px-4 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={row.ativo}
                            onChange={(e) =>
                              setAcrescimos((p) =>
                                p.map((r) =>
                                  r.key === row.key ? { ...r, ativo: e.target.checked } : r,
                                ),
                              )
                            }
                          />
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              disabled={row.saving}
                              onClick={() => void salvarAcrescimo(row)}
                              className="rounded-md p-2 text-primary-700 hover:bg-primary-50"
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
                              className="rounded-md p-2 text-red-600 hover:bg-red-50"
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
          </div>

          <div className="overflow-hidden ug-card shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-6">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Feriados (gatilho «Feriado»)
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Datas consideradas feriado para acréscimos com gatilho feriado.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFeriados((p) => [...p, novaLinhaFeriado()])}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Plus className="h-4 w-4" /> Adicionar feriado
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[28rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-600">
                    <th className="px-4 py-3">Data</th>
                    <th className="px-4 py-3">Nome</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {feriados.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                        Cadastre feriados nacionais ou locais para o acréscimo de feriado.
                      </td>
                    </tr>
                  ) : (
                    feriados.map((row) => (
                      <tr key={row.key} className="border-b border-slate-50 last:border-0">
                        <td className="px-4 py-2">
                          <input
                            type="date"
                            className={inputCls}
                            value={row.data_feriado}
                            onChange={(e) =>
                              setFeriados((p) =>
                                p.map((r) =>
                                  r.key === row.key
                                    ? { ...r, data_feriado: e.target.value }
                                    : r,
                                ),
                              )
                            }
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            className={inputCls}
                            value={row.nome}
                            onChange={(e) =>
                              setFeriados((p) =>
                                p.map((r) =>
                                  r.key === row.key ? { ...r, nome: e.target.value } : r,
                                ),
                              )
                            }
                          />
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              disabled={row.saving}
                              onClick={() => void salvarFeriado(row)}
                              className="rounded-md p-2 text-primary-700 hover:bg-primary-50"
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
                              onClick={() => void removerFeriado(row)}
                              className="rounded-md p-2 text-red-600 hover:bg-red-50"
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
          </div>
        </>
      )}
    </section>
  )
}
