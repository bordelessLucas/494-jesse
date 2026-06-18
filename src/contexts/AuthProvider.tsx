import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'

import { subscribeSupabaseAuth } from '../lib/auth/subscribeSupabaseAuth'

type AuthContextValue = {
  user: User | null
  session: Session | null
  isLoading: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true

    const subscription = subscribeSupabaseAuth((_event, nextSession) => {
      if (!active) return
      setSession(nextSession)
      setIsLoading(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const value = useMemo(
    (): AuthContextValue => ({
      user: session?.user ?? null,
      session,
      isLoading,
    }),
    [session, isLoading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('Hooks de auth devem ser usados dentro de AuthProvider')
  }
  return ctx
}

export function useSupabaseUser() {
  const { user, isLoading } = useAuthContext()
  return { user, isLoading }
}

export function useAuthSession() {
  const { session, isLoading } = useAuthContext()
  return { session, isLoading }
}
