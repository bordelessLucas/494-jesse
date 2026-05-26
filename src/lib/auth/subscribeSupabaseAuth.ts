import type { AuthChangeEvent, Session, Subscription } from '@supabase/supabase-js'

import { supabase } from '../supabase'

export type AuthChangeHandler = (
  event: AuthChangeEvent,
  session: Session | null,
) => void

/**
 * Subscrição segura ao auth — adia o callback para evitar deadlock
 * quando `signInWithPassword` ainda não terminou (issue supabase-js).
 */
export function subscribeSupabaseAuth(handler: AuthChangeHandler): Subscription {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    window.setTimeout(() => {
      handler(event, session)
    }, 0)
  })
  return subscription
}

export function tenantUserIdFromSession(session: Session): string {
  const meta = session.user.user_metadata as Record<string, unknown> | undefined
  const tenant = meta?.tenant_user_id
  if (typeof tenant === 'string' && tenant.trim().length > 0) {
    return tenant
  }
  return session.user.id
}
