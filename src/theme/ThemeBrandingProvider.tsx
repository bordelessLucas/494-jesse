import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'

import {
  applyPrimaryCssVariables,
  clearStoredThemeColorForEarlyPaint,
  DEFAULT_PRIMARY_HEX,
  normalizeBrandHex,
  persistThemeColorForEarlyPaint,
  resetPrimaryCssVariables,
} from '../lib/brandColors'
import {
  subscribeSupabaseAuth,
  tenantUserIdFromSession,
} from '../lib/auth/subscribeSupabaseAuth'
import { supabase } from '../lib/supabase'

type PersistInput = {
  primaryColor: string
  logoFile: File | null
  removeLogo: boolean
}

type ThemeBrandingContextValue = {
  primaryColor: string
  logoUrl: string | null
  isReady: boolean
  loadError: string | null
  previewPrimaryColor: string | null
  setPreviewPrimaryColor: (hex: string | null) => void
  reloadBranding: () => Promise<void>
  persistBranding: (input: PersistInput) => Promise<{ error?: string }>
}

const ThemeBrandingContext =
  createContext<ThemeBrandingContextValue | null>(null)

async function fetchBrandingForSession(session: Session) {
  const brandingUserId = tenantUserIdFromSession(session)
  return supabase
    .from('user_branding')
    .select('primary_color, logo_url')
    .eq('user_id', brandingUserId)
    .maybeSingle()
}

export function ThemeBrandingProvider({ children }: { children: ReactNode }) {
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_PRIMARY_HEX)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [previewPrimaryColor, setPreviewPrimaryColor] = useState<string | null>(
    null,
  )
  const [isReady, setIsReady] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const effectivePrimary = previewPrimaryColor ?? primaryColor

  useEffect(() => {
    applyPrimaryCssVariables(effectivePrimary)
  }, [effectivePrimary])

  const applyFetched = useCallback(
    (row: { primary_color: string; logo_url: string | null } | null) => {
      const hex =
        normalizeBrandHex(row?.primary_color ?? '') ?? DEFAULT_PRIMARY_HEX
      applyPrimaryCssVariables(hex)
      persistThemeColorForEarlyPaint(hex)
      setPrimaryColor(hex)
      setLogoUrl(row?.logo_url ?? null)
      setPreviewPrimaryColor(null)
    },
    [],
  )

  const clearBranding = useCallback(() => {
    resetPrimaryCssVariables()
    clearStoredThemeColorForEarlyPaint()
    setPrimaryColor(DEFAULT_PRIMARY_HEX)
    setLogoUrl(null)
    setPreviewPrimaryColor(null)
    setLoadError(null)
  }, [])

  const handleSession = useCallback(
    async (session: Session | null) => {
      if (!session?.user) {
        clearBranding()
        setIsReady(true)
        return
      }

      setLoadError(null)
      try {
        const { data, error } = await fetchBrandingForSession(session)
        if (error) {
          console.error(error)
          setLoadError('Não foi possível carregar sua marca. Usando padrões.')
          applyFetched(null)
        } else {
          applyFetched(data)
        }
      } catch (e) {
        console.error(e)
        applyFetched(null)
      } finally {
        setIsReady(true)
      }
    },
    [applyFetched, clearBranding],
  )

  useEffect(() => {
    let active = true

    const subscription = subscribeSupabaseAuth((_event, session) => {
      if (!active) return
      void handleSession(session)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [handleSession])

  const persistBranding = useCallback(
    async (input: PersistInput) => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session?.user) {
        return { error: 'Sessão inválida.' }
      }

      const hex = normalizeBrandHex(input.primaryColor) ?? DEFAULT_PRIMARY_HEX

      let nextLogo = logoUrl
      if (input.removeLogo) {
        nextLogo = null
      }
      if (input.logoFile) {
        const ext = input.logoFile.name.split('.').pop()?.toLowerCase()
        const safeExt =
          ext && /^[a-z0-9]+$/i.test(ext) && ext.length <= 8 ? ext : 'png'
        const path = `${session.user.id}/logo.${safeExt}`
        const { error: upErr } = await supabase.storage
          .from('branding-logos')
          .upload(path, input.logoFile, {
            upsert: true,
            contentType: input.logoFile.type || 'image/png',
          })
        if (upErr) {
          return { error: upErr.message }
        }
        const { data: pub } = supabase.storage
          .from('branding-logos')
          .getPublicUrl(path)
        nextLogo = pub.publicUrl
      }

      const { error } = await supabase.from('user_branding').upsert(
        {
          user_id: session.user.id,
          primary_color: hex,
          logo_url: nextLogo,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      )

      if (error) {
        return { error: error.message }
      }

      persistThemeColorForEarlyPaint(hex)
      applyPrimaryCssVariables(hex)
      setPrimaryColor(hex)
      setLogoUrl(nextLogo)
      setPreviewPrimaryColor(null)
      return {}
    },
    [logoUrl],
  )

  const reloadBranding = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    await handleSession(session)
  }, [handleSession])

  const value = useMemo(
    (): ThemeBrandingContextValue => ({
      primaryColor,
      logoUrl,
      isReady,
      loadError,
      previewPrimaryColor,
      setPreviewPrimaryColor,
      reloadBranding,
      persistBranding,
    }),
    [
      primaryColor,
      logoUrl,
      isReady,
      loadError,
      previewPrimaryColor,
      reloadBranding,
      persistBranding,
    ],
  )

  return (
    <ThemeBrandingContext.Provider value={value}>
      {children}
    </ThemeBrandingContext.Provider>
  )
}

export function useThemeBranding() {
  const ctx = useContext(ThemeBrandingContext)
  if (!ctx) {
    throw new Error('useThemeBranding deve estar dentro de ThemeBrandingProvider')
  }
  return ctx
}
