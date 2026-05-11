import { useEffect, useState } from 'react'

import { cn } from '../../lib/cn'
import { useThemeBranding } from '../../theme/ThemeBrandingProvider'

/** Onde o logo aparece: define contraste do fallback com iniciais. */
export type BrandLogoSurface = 'light' | 'dark'

type BrandedLogoOrInitialProps = {
  /** Classes no contêiner (tamanho, cantos). */
  className?: string
  initial?: string
  alt?: string
  /**
   * Quando definido (incluindo `null`), substitui o logo vindo do contexto.
   * Útil na tela de edição com pré-visualização local.
   */
  logoSrc?: string | null
  /**
   * `light`: topbar / fundo claro — iniciais em pastilha primary.
   * `dark`: sidebar — iniciais em vidro sobre fundo escuro (sem caixa colorida no logo).
   */
  surface?: BrandLogoSurface
}

export function BrandedLogoOrInitial({
  className,
  initial = 'P',
  alt = 'Logotipo',
  logoSrc: logoSrcProp,
  surface = 'light',
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
        'flex items-center justify-center overflow-hidden font-semibold leading-none text-white',
        surface === 'dark'
          ? 'bg-white/15 text-white ring-1 ring-inset ring-white/20'
          : 'bg-primary-600 text-white shadow-sm',
        className,
      )}
    >
      <span className="text-sm">{initial}</span>
    </div>
  )
}
