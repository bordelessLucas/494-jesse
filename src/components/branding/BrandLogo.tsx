import { cn } from '../../lib/cn'

export type BrandLogoVariant =
  | 'symbol'
  | 'horizontal'
  | 'horizontal2l'
  | 'vertical'
  | 'vertical2l'

export type BrandLogoSurface = 'light' | 'dark'

export type BrandLogoTone = 'color' | 'mono'

export type BrandLogoSize = 'sm' | 'md' | 'lg' | 'xl' | number

type BrandLogoProps = {
  variant?: BrandLogoVariant
  surface?: BrandLogoSurface
  tone?: BrandLogoTone
  size?: BrandLogoSize
  className?: string
  alt?: string
  decorative?: boolean
}

/**
 * Mapa oficial public/SVG — não recolorir nem alterar paths.
 * Clara = wordmark claro → fundo escuro
 * Escura = wordmark escuro → fundo claro
 * Branca = monocromática clara → fundo escuro/colorido
 */
const LOGO_SRC: Record<
  BrandLogoVariant,
  Record<'color-light' | 'color-dark' | 'mono-light' | 'mono-dark', string>
> = {
  symbol: {
    'color-light': '/SVG/06_UG_Simbolo_Ciano.svg',
    'color-dark': '/SVG/06_UG_Simbolo_Ciano.svg',
    'mono-light': '/SVG/06_UG_Simbolo_Ciano.svg',
    'mono-dark': '/SVG/11_UG_Simbolo_Branco.svg',
  },
  horizontal: {
    'color-light': '/SVG/07_UG_Horizontal_Escura.svg',
    'color-dark': '/SVG/02_UG_Horizontal_Clara.svg',
    'mono-light': '/SVG/07_UG_Horizontal_Escura.svg',
    'mono-dark': '/SVG/12_UG_Horizontal_Branca.svg',
  },
  horizontal2l: {
    'color-light': '/SVG/08_UG_Horizontal_2L_Escura.svg',
    'color-dark': '/SVG/03_UG_Horizontal_2L_Clara.svg',
    'mono-light': '/SVG/08_UG_Horizontal_2L_Escura.svg',
    'mono-dark': '/SVG/13_UG_Horizontal_2L_Branca.svg',
  },
  vertical: {
    'color-light': '/SVG/09_UG_Vertical_Escura.svg',
    'color-dark': '/SVG/04_UG_Vertical_Clara.svg',
    'mono-light': '/SVG/09_UG_Vertical_Escura.svg',
    'mono-dark': '/SVG/14_UG_Vertical_Branca.svg',
  },
  vertical2l: {
    'color-light': '/SVG/10_UG_Vertical_2L_Escura.svg',
    'color-dark': '/SVG/05_UG_Vertical_2L_Clara.svg',
    'mono-light': '/SVG/10_UG_Vertical_2L_Escura.svg',
    'mono-dark': '/SVG/15_UG_Vertical_2L_Branca.svg',
  },
}

/** Alturas padrão; largura auto preserva proporção (manual: símbolo ≥48px, horizontal ≥160px). */
const SIZE_HEIGHT_PX: Record<'sm' | 'md' | 'lg' | 'xl', number> = {
  sm: 28,
  md: 36,
  lg: 48,
  xl: 64,
}

function resolveSrc(
  variant: BrandLogoVariant,
  surface: BrandLogoSurface,
  tone: BrandLogoTone,
): string {
  const key =
    tone === 'mono'
      ? surface === 'dark'
        ? 'mono-dark'
        : 'mono-light'
      : surface === 'dark'
        ? 'color-dark'
        : 'color-light'
  return LOGO_SRC[variant][key]
}

export function BrandLogo({
  variant = 'horizontal',
  surface = 'light',
  tone = 'color',
  size = 'md',
  className,
  alt = 'Unique Gestor',
  decorative = false,
}: BrandLogoProps) {
  const src = resolveSrc(variant, surface, tone)
  const heightPx = typeof size === 'number' ? size : SIZE_HEIGHT_PX[size]

  return (
    <img
      src={src}
      alt={decorative ? '' : alt}
      aria-hidden={decorative || undefined}
      className={cn('block h-auto max-w-full object-contain object-left', className)}
      style={{ height: heightPx, width: 'auto' }}
      decoding="async"
    />
  )
}
