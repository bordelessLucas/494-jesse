import { Loader2, Pencil, Plus, Trash2, UserPlus, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { cn } from '../../../lib/cn'
import { criarAcessoGestaoMembro } from '../../../lib/gestao/criarAcessoGestaoMembro'
import type {
  FiltroStatusMembroGestao,
  MembroGestaoLinha,
  PerfilGestaoMembro,
} from '../../../lib/gestao/gestaoMembroAcessoTypes'
import {
  definicoesPermissoesPorPerfil,
  permissoesPadraoPorPerfil,
  SENHA_PADRAO_MEMBRO_GESTAO,
  statusMembroGestao,
  tituloPerfilGestao,
} from '../../../lib/gestao/gestaoMembroAcessoTypes'
import {
  atualizarPermissoesMembroGestao,
  excluirMembroGestao,
  listarMembrosGestao,
} from '../../../lib/gestao/gestaoMembrosDb'

type UtilizadoresGestaoPageProps = {
  perfil: PerfilGestaoMembro
}

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

export function UtilizadoresGestaoPage({ perfil }: UtilizadoresGestaoPageProps) {
  const titulo = tituloPerfilGestao(perfil)
  const definicoesPerm = definicoesPermissoesPorPerfil(perfil)

  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [lista, setLista] = useState<MembroGestaoLinha[]>([])
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatusMembroGestao>('todos')
  const [modalCriar, setModalCriar] = useState(false)
  const [modalEditar, setModalEditar] = useState<MembroGestaoLinha | null>(null)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [permissoes, setPermissoes] = useState<Record<string, boolean>>(() =>
    permissoesPadraoPorPerfil(perfil),
  )
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState<string | null>(null)

  const recarregar = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      const rows = await listarMembrosGestao(perfil)
      setLista(rows)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível carregar utilizadores.')
    } finally {
      setCarregando(false)
    }
  }, [perfil])

  useEffect(() => {
    void recarregar()
  }, [recarregar])

  const listaFiltrada = useMemo(() => {
    if (filtroStatus === 'todos') return lista
    return lista.filter((m) => statusMembroGestao(m) === filtroStatus)
  }, [lista, filtroStatus])

  function abrirCriar() {
    setNome('')
    setEmail('')
    setPermissoes(permissoesPadraoPorPerfil(perfil))
    setSucesso(null)
    setErro(null)
    setModalCriar(true)
  }

  function abrirEditar(m: MembroGestaoLinha) {
    setPermissoes({ ...permissoesPadraoPorPerfil(perfil), ...m.permissoes })
    setSucesso(null)
    setErro(null)
    setModalEditar(m)
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
    setSucesso(null)
    try {
      const res = await criarAcessoGestaoMembro({
        perfil,
        nome,
        email,
        permissoes,
      })
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
    setSucesso(null)
    try {
      await atualizarPermissoesMembroGestao(modalEditar.id, permissoes)
      setSucesso('Permissões atualizadas.')
      fecharModais()
      await recarregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao atualizar permissões.')
    } finally {
      setSalvando(false)
    }
  }

  async function remover(m: MembroGestaoLinha) {
    if (!window.confirm(`Remover acesso de ${m.nome}?`)) return
    setErro(null)
    try {
      await excluirMembroGestao(m.id)
      await recarregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao remover acesso.')
    }
  }

  function togglePermissao(key: string) {
    setPermissoes((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const modalAberto = modalCriar || modalEditar !== null

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Cadastros (Gestão) — Utilizadores
          </p>
          <h1 className="mt-1 text-xl font-semibold text-slate-900">{titulo}</h1>
          <p className="mt-1 text-sm text-slate-600">
            Gestão de acessos com permissões granulares para o workflow multinível.
          </p>
        </div>
        <button
          type="button"
          onClick={abrirCriar}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <UserPlus className="h-4 w-4" />
          Criar acesso
        </button>
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

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
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
                    Nenhum utilizador encontrado.
                  </td>
                </tr>
              ) : (
                listaFiltrada.map((m) => (
                  <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-medium text-slate-900">{m.nome}</td>
                    <td className="px-4 py-3 text-slate-600">{m.email}</td>
                    <td className="px-4 py-3">
                      <BadgeStatus pendente={m.must_change_password} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => abrirEditar(m)}
                          className="rounded p-2 text-slate-600 hover:bg-slate-100"
                          title="Editar permissões"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void remover(m)}
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
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-lg rounded-xl bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-semibold text-slate-900">
                {modalCriar ? `Criar acesso — ${titulo}` : `Permissões — ${modalEditar?.nome}`}
              </h2>
              <button
                type="button"
                onClick={fecharModais}
                className="rounded p-1 text-slate-500 hover:bg-slate-100"
              >
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
                    Senha inicial padrão: <strong>{SENHA_PADRAO_MEMBRO_GESTAO}</strong> (alteração
                    obrigatória no primeiro acesso).
                  </p>
                </div>
              ) : null}

              <p className="mb-3 text-sm font-medium text-slate-800">Permissões</p>
              <ul className="space-y-2">
                {definicoesPerm.map(({ key, label }) => (
                  <li key={key}>
                    <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={Boolean(permissoes[key])}
                        onChange={() => togglePermissao(key)}
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
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
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
