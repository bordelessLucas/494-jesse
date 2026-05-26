import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

import { subscribeSupabaseAuth } from '../lib/auth/subscribeSupabaseAuth'

type UseSupabaseUserState = {
  user: User | null
  isLoading: boolean
}

export function useSupabaseUser(): UseSupabaseUserState {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const subscription = subscribeSupabaseAuth((_event, session) => {
      if (!isMounted) return
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  return { user, isLoading }
}
