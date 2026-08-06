import { Lock, Mail } from 'lucide-react'
import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { supabase } from '../lib/supabase'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const canSubmit = useMemo(() => {
    return email.trim().length > 0 && password.length > 0 && !isSubmitting
  }, [email, isSubmitting, password])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setErrorMessage(null)
    setIsSubmitting(true)
    try {
      const login = supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      const timeout = new Promise<never>((_, reject) => {
        window.setTimeout(
          () => reject(new Error('Tempo esgotado ao entrar. Tente novamente.')),
          20_000,
        )
      })

      const { data, error } = await Promise.race([login, timeout])

      if (error) {
        setErrorMessage(error.message)
        return
      }

      if (data.session) {
        const from =
          (location.state as { from?: { pathname?: string } } | null)?.from
            ?.pathname ?? '/'
        const target = from.startsWith('/') ? from : '/'
        navigate(target, { replace: true })
      } else {
        setErrorMessage('Login sem sessão. Verifique e-mail e senha.')
      }
    } catch (e) {
      setErrorMessage(
        e instanceof Error ? e.message : 'Não foi possível entrar. Tente novamente.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <div className="mb-7">
        <h1 className="ug-page-title text-2xl">Entrar</h1>
        <p className="ug-page-subtitle">
          Use seu e-mail e senha para acessar a Unique Gestor.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage ? (
          <div
            role="alert"
            className="rounded-ug border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700"
          >
            {errorMessage}
          </div>
        ) : null}

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-semibold text-ug-celestial">
            E-mail
          </label>
          <div className="group relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ug-muted transition-colors group-focus-within:text-primary-600" />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="voce@exemplo.com"
              className="ug-input pl-11"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-semibold text-ug-celestial">
            Senha
          </label>
          <div className="group relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ug-muted transition-colors group-focus-within:text-primary-600" />
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className="ug-input pl-11"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            className="text-sm font-semibold text-primary-700 underline-offset-4 transition hover:text-primary-800 hover:underline"
          >
            Esqueci minha senha
          </button>

          <Link
            to="/cadastro"
            className="text-sm font-semibold text-primary-700 underline-offset-4 transition hover:text-primary-800 hover:underline"
          >
            Criar conta
          </Link>
        </div>

        <button type="submit" className="ug-btn-primary w-full" disabled={!canSubmit}>
          {isSubmitting ? 'Preparando sua área...' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
