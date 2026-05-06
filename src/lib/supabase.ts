import { createClient } from '@supabase/supabase-js'

import type { Database } from '../types/database.types'

function getRequiredViteEnvValue(variableName: string): string {
  const value = (import.meta.env as Record<string, unknown>)[variableName]

  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(
      `Missing required environment variable: ${variableName}. ` +
        `Add it to your local .env file (see .env.example).`,
    )
  }

  return value
}

const supabaseUrl = getRequiredViteEnvValue('VITE_SUPABASE_URL')

const supabaseAnonKey =
  (import.meta.env as Record<string, unknown>)['VITE_SUPABASE_ANON_KEY'] ??
  (import.meta.env as Record<string, unknown>)['VITE_SUPABASE_PUBLISHABLE_KEY']

if (typeof supabaseAnonKey !== 'string' || supabaseAnonKey.trim().length === 0) {
  throw new Error(
    'Missing required environment variable: VITE_SUPABASE_ANON_KEY. ' +
      'You can also provide VITE_SUPABASE_PUBLISHABLE_KEY as a fallback. ' +
      'Add it to your local .env file (see .env.example).',
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

