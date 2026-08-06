import { useEffect, useState } from 'react'

import { cn } from '../../lib/cn'
import { useThemeBranding } from '../../theme/ThemeBrandingProvider'
import { BrandLogo, type BrandLogoSurface } from './BrandLogo'

export type { BrandLogoSurface }

type BrandedLogoOrInitialProps = {
  /** Classes no contêiner (tamanho, cantos). */
  className?: string
  /** @deprecated Mantido por compatibilidade; fallback usa BrandLogo oficial. */
  initial?: string
  alt?: string
  /**
   * Quando definido (incluindo `null`), substitui o logo vindo do contexto.
   * Útil na tela de edição com pré-visualização local.
   */
  logoSrc?: string | null
  /**
   * `light`: topbar / fundo claro.
   * `dark`: sidebar / fundo escuro ou cor de marca.
   */
  surface?: BrandLogoSurface
  /** Variante do fallback institucional quando não há logo do tenant. */
  fallbackVariant?: 'symbol' | 'horizontal' | 'horizontal2l'
}

export function BrandedLogoOrInitial({
  className,
  alt = 'Logotipo',
  logoSrc: logoSrcProp,
  surface = 'light',
  fallbackVariant = 'symbol',
}: BrandedLogoOrInitialProps) {
  const { logoUrl } = useThemeBranding()
  const resolvedLogo = logoSrcProp !== undefined ? logoSrcProp : logoUrl
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [resolvedLogo])

  const showImg = Boolean(resolvedLogo && !failed)

  if (showImg) {
    return (
      <div
        className={cn(
          'flex items-center justify-center overflow-hidden bg-transparent',
          className,
        )}
      >
        <img
          src={resolvedLogo!}
          alt={alt}
          className="max-h-full max-w-full object-contain object-center"
          onError={() => setFailed(true)}
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center overflow-hidden bg-transparent',
        className,
      )}
    >
      <BrandLogo
        variant={fallbackVariant}
        surface={surface}
        tone={surface === 'dark' ? 'mono' : 'color'}
        size="md"
        alt={alt}
        className="max-h-full max-w-full"
        decorative={alt === ''}
      />
    </div>
  )
}
