import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

import { supabase } from '../lib/supabase'

type UseSupabaseUserState = {
  user: User | null
  isLoading: boolean
}

export function useSupabaseUser(): UseSupabaseUserState {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadInitialUser() {
      const { data, error } = await supabase.auth.getSession()
      if (!isMounted) return

      if (error) {
        setUser(null)
        setIsLoading(false)
        return
      }

      setUser(data.session?.user ?? null)
      setIsLoading(false)
    }

    void loadInitialUser()

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (!isMounted) return
        setUser(nextSession?.user ?? null)
        setIsLoading(false)
      },
    )

    return () => {
      isMounted = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  return { user, isLoading }
}

