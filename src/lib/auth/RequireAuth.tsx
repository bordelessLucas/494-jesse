import { useEffect, useMemo, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'

import { supabase } from '../supabase'

type AuthGateProps = {
  children?: React.ReactNode
}

export function RequireAuth({ children }: AuthGateProps) {
  const location = useLocation()
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadSession() {
      const { data, error } = await supabase.auth.getSession()
      if (!isMounted) return

      if (error) {
        setSession(null)
        setIsLoading(false)
        return
      }

      setSession(data.session ?? null)
      setIsLoading(false)
    }

    void loadSession()

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (!isMounted) return
        setSession(nextSession)
        setIsLoading(false)
      },
    )

    return () => {
      isMounted = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  if (isLoading) {
    return (
      <div className="grid min-h-dvh place-items-center bg-slate-50 px-4">
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-700 shadow-sm">
          Carregando sessão...
        </div>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children ? <>{children}</> : <Outlet />
}

export function RedirectIfAuthenticated({ children }: AuthGateProps) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = useMemo(() => Boolean(session), [session])

  useEffect(() => {
    let isMounted = true

    async function loadSession() {
      const { data, error } = await supabase.auth.getSession()
      if (!isMounted) return

      if (error) {
        setSession(null)
        setIsLoading(false)
        return
      }

      setSession(data.session ?? null)
      setIsLoading(false)
    }

    void loadSession()

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (!isMounted) return
        setSession(nextSession)
        setIsLoading(false)
      },
    )

    return () => {
      isMounted = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  if (isLoading) return children ? <>{children}</> : <Outlet />

  if (isAuthenticated) return <Navigate to="/" replace />

  return children ? <>{children}</> : <Outlet />
}

