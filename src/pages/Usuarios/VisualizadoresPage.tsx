import { Eye, Loader2, Pencil, Plus, Trash2, UserPlus, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { cn } from '../../lib/cn'
import { criarAcessoVisualizador } from '../../lib/visualizadores/criarAcessoVisualizador'
import {
  PERMISSOES_VISUALIZADOR,
  permissoesPadraoVisualizador,
  SENHA_PADRAO_VISUALIZADOR,
  statusVisualizador,
  type FiltroStatusVisualizador,
  type VisualizadorLinha,
} from '../../lib/visualizadores/visualizadorTypes'
import {
  atualizarPermissoesVisualizador,
  excluirVisualizador,
  listarVisualizadores,
} from '../../lib/visualizadores/visualizadoresDb'

function BadgeStatus({ pendente }: { pendente: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
        pendente ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900',
      )}
    >
      {pendente ? 'Pendente' : 'Ativo'}
    </span>
  )
}

export function VisualizadoresPage() {
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)
  const [lista, setLista] = useState<VisualizadorLinha[]>([])
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatusVisualizador>('todos')
  const [modalCriar, setModalCriar] = useState(false)
  const [modalEditar, setModalEditar] = useState<VisualizadorLinha | null>(null)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [permissoes, setPermissoes] = useState<Record<string, boolean>>(() =>
    permissoesPadraoVisualizador(),
  )
  const [salvando, setSalvando] = useState(false)

  const recarregar = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      setLista(await listarVisualizadores())
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar visualizadores.')
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    void recarregar()
  }, [recarregar])

  const listaFiltrada = useMemo(() => {
    if (filtroStatus === 'todos') return lista
    return lista.filter((v) => statusVisualizador(v) === filtroStatus)
  }, [lista, filtroStatus])

  const modalAberto = modalCriar || modalEditar !== null

  function abrirCriar() {
    setNome('')
    setEmail('')
    setPermissoes(permissoesPadraoVisualizador())
    setSucesso(null)
    setErro(null)
    setModalCriar(true)
  }

  function abrirEditar(v: VisualizadorLinha) {
    setPermissoes({ ...permissoesPadraoVisualizador(), ...v.permissoes })
    setSucesso(null)
    setErro(null)
    setModalEditar(v)
  }

  function fecharModais() {
    setModalCriar(false)
    setModalEditar(null)
  }

  async function confirmarCriar() {
    if (!nome.trim() || !email.trim()) {
      setErro('Informe nome e e-mail.')
      return
    }
    setSalvando(true)
    setErro(null)
    try {
      const res = await criarAcessoVisualizador({ nome, email, permissoes })
      setSucesso(
        res.senhaInicial
          ? `${res.mensagem} Senha inicial: ${res.senhaInicial}`
          : res.mensagem,
      )
      fecharModais()
      await recarregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao criar acesso.')
    } finally {
      setSalvando(false)
    }
  }

  async function confirmarEditar() {
    if (!modalEditar) return
    setSalvando(true)
    setErro(null)
    try {
      await atualizarPermissoesVisualizador(modalEditar.id, permissoes)
      setSucesso('Permissões atualizadas.')
      fecharModais()
      await recarregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao atualizar.')
    } finally {
      setSalvando(false)
    }
  }

  async function remover(v: VisualizadorLinha) {
    if (!window.confirm(`Remover acesso de ${v.nome}?`)) return
    try {
      await excluirVisualizador(v.id)
      await recarregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao remover.')
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Cadastros & Equipe
          </p>
          <h1 className="mt-1 text-xl font-semibold text-slate-900">Visualizadores</h1>
          <p className="mt-1 text-sm text-slate-600">
            Utilizadores de auditoria externa ou direção hospitalar — acesso somente leitura à
            plataforma.
          </p>
        </div>
        <button
          type="button"
          onClick={abrirCriar}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <UserPlus className="h-4 w-4" />
          Criar acesso
        </button>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950">
        <Eye className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <p>
          Perfis visualizadores navegam em modo <strong>somente leitura</strong>: botões de
          escrita (guardar, excluir, criar) ficam ocultos ou bloqueados em toda a aplicação.
        </p>
      </div>

      {erro && !modalAberto ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {erro}
        </div>
      ) : null}
      {sucesso && !modalAberto ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {sucesso}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-slate-700">Status:</span>
        {(['todos', 'ativo', 'pendente'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFiltroStatus(s)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium capitalize transition',
              filtroStatus === s
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
            )}
          >
            {s === 'todos' ? 'Todos' : s === 'ativo' ? 'Ativo' : 'Pendente'}
          </button>
        ))}
      </div>

      <div className="overflow-hidden ug-card shadow-sm">
        {carregando ? (
          <div className="flex min-h-[200px] items-center justify-center text-slate-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            A carregar…
          </div>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">E-mail</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {listaFiltrada.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                    Nenhum visualizador cadastrado.
                  </td>
                </tr>
              ) : (
                listaFiltrada.map((v) => (
                  <tr key={v.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-medium text-slate-900">{v.nome}</td>
                    <td className="px-4 py-3 text-slate-600">{v.email}</td>
                    <td className="px-4 py-3">
                      <BadgeStatus pendente={v.must_change_password} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => abrirEditar(v)}
                          className="rounded p-2 text-slate-600 hover:bg-slate-100"
                          title="Editar permissões"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void remover(v)}
                          className="rounded p-2 text-red-600 hover:bg-red-50"
                          title="Remover acesso"
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
        )}
      </div>

      {modalAberto ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div role="dialog" aria-modal="true" className="w-full max-w-lg rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-semibold text-slate-900">
                {modalCriar ? 'Criar visualizador' : `Permissões — ${modalEditar?.nome}`}
              </h2>
              <button type="button" onClick={fecharModais} className="rounded p-1 text-slate-500 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
              {erro && modalAberto ? (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  {erro}
                </div>
              ) : null}
              {modalCriar ? (
                <div className="mb-4 space-y-3">
                  <label className="block text-sm">
                    <span className="font-medium text-slate-700">Nome completo</span>
                    <input
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="font-medium text-slate-700">E-mail</span>
                    <input
                      type="email"
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </label>
                  <p className="text-xs text-slate-500">
                    Senha inicial: <strong>{SENHA_PADRAO_VISUALIZADOR}</strong>
                  </p>
                </div>
              ) : null}
              <p className="mb-3 text-sm font-medium text-slate-800">Áreas visíveis (somente leitura)</p>
              <ul className="space-y-2">
                {PERMISSOES_VISUALIZADOR.map(({ key, label }) => (
                  <li key={key}>
                    <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={Boolean(permissoes[key])}
                        onChange={() =>
                          setPermissoes((prev) => ({ ...prev, [key]: !prev[key] }))
                        }
                        className="mt-0.5 rounded border-slate-300"
                      />
                      <span>{label}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
              <button
                type="button"
                onClick={fecharModais}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={salvando}
                onClick={() => void (modalCriar ? confirmarCriar() : confirmarEditar())}
                className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
              >
                {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {modalCriar ? 'Criar acesso' : 'Guardar permissões'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
