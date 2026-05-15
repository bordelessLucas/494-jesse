import { Lock, Mail } from 'lucide-react'
import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { supabase } from '../lib/supabase'
import { useThemeBranding } from '../theme/ThemeBrandingProvider'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { reloadBranding } = useThemeBranding()
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        setErrorMessage(error.message)
        return
      }

      if (data.session) {
        await reloadBranding()
        const from =
          (location.state as { from?: { pathname?: string } } | null)?.from
            ?.pathname ?? '/'
        const target = from.startsWith('/') ? from : '/'
        navigate(target, { replace: true })
        return
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Entrar
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
          Use seu e-mail e senha para acessar.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="text-sm font-medium text-slate-700"
          >
            E-mail
          </label>
          <div className="group relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary-600" />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="voce@exemplo.com"
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white/70 pl-11 pr-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-primary-400 focus:ring-4 focus:ring-primary-100"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="text-sm font-medium text-slate-700"
          >
            Senha
          </label>
          <div className="group relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary-600" />
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white/70 pl-11 pr-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-primary-400 focus:ring-4 focus:ring-primary-100"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            className="text-sm font-medium text-primary-700 underline-offset-4 transition hover:text-primary-800 hover:underline focus:outline-none focus:ring-2 focus:ring-primary-200 focus:ring-offset-2 focus:ring-offset-white"
          >
            Esqueci minha senha
          </button>

          <Link
            to="/cadastro"
            className="text-sm font-medium text-primary-700 underline-offset-4 transition hover:text-primary-800 hover:underline focus:outline-none focus:ring-2 focus:ring-primary-200 focus:ring-offset-2 focus:ring-offset-white"
          >
            Criar conta
          </Link>
        </div>

        <button
          type="submit"
          className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!canSubmit}
        >
          {isSubmitting ? 'Preparando sua área...' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}

