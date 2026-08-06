import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import { marcarSenhaAlterada } from '../lib/auth/contaMembroDb'
import { useContaMembro } from '../hooks/useContaMembro'
import { useSupabaseUser } from '../hooks/useSupabaseUser'
import { supabase } from '../lib/supabase'

export function AlterarSenhaObrigatoriaPage() {
  const navigate = useNavigate()
  const { user } = useSupabaseUser()
  const { mustChangePassword, recarregar, isMembroProfissional } = useContaMembro()
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  if (!user) return null

  if (!isMembroProfissional) {
    return <Navigate to="/painel/resumo" replace />
  }

  if (!mustChangePassword) {
    return <Navigate to="/minha-agenda" replace />
  }

  async function aoSalvar(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)

    if (senha.trim().length < 8) {
      setErro('A nova senha deve ter pelo menos 8 caracteres.')
      return
    }
    if (senha !== confirmar) {
      setErro('As senhas não coincidem.')
      return
    }

    setSalvando(true)
    const { error } = await supabase.auth.updateUser({ password: senha })
    if (error) {
      setSalvando(false)
      setErro(error.message)
      return
    }

    try {
      await marcarSenhaAlterada(user!.id)
      await recarregar()
      navigate('/minha-agenda', { replace: true })
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao actualizar registo.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4">
      <div className="ug-card w-full p-6 sm:p-8">
        <h1 className="ug-page-title text-xl">Alterar senha</h1>
        <p className="ug-page-subtitle">
          Por segurança, defina uma nova senha antes de continuar a usar a Unique Gestor.
        </p>

        <form className="mt-6 space-y-4" onSubmit={(e) => void aoSalvar(e)}>
          {erro ? (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {erro}
            </p>
          ) : null}

          <label className="block text-sm font-medium text-slate-700">
            Nova senha
            <input
              type="password"
              autoComplete="new-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm shadow-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Confirmar senha
            <input
              type="password"
              autoComplete="new-password"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm shadow-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </label>

          <button
            type="submit"
            disabled={salvando}
            className="ug-btn-primary w-full"
          >
            {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Guardar e continuar
          </button>
        </form>
      </div>
    </div>
  )
}
