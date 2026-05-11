/** Cor primária padrão da plataforma (Tailwind primary-600 original). */
export const DEFAULT_PRIMARY_HEX = '#2563eb'

const SHADE_KEYS = [
  '50',
  '100',
  '200',
  '300',
  '400',
  '500',
  '600',
  '700',
  '800',
  '900',
  '950',
] as const

export type PrimaryShade = (typeof SHADE_KEYS)[number]

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function hexToRgb(hex: string): [number, number, number] | null {
  const raw = hex.trim().replace('#', '')
  if (raw.length === 3) {
    const r = parseInt(raw[0] + raw[0], 16)
    const g = parseInt(raw[1] + raw[1], 16)
    const b = parseInt(raw[2] + raw[2], 16)
    if ([r, g, b].some((v) => Number.isNaN(v))) return null
    return [r, g, b]
  }
  if (raw.length !== 6) return null
  const r = parseInt(raw.slice(0, 2), 16)
  const g = parseInt(raw.slice(2, 4), 16)
  const b = parseInt(raw.slice(4, 6), 16)
  if ([r, g, b].some((v) => Number.isNaN(v))) return null
  return [r, g, b]
}

function rgbToHsl(
  r: number,
  g: number,
  b: number,
): [number, number, number] {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  let h = 0
  let s = 0

  const d = max - min
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case rn:
        h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6
        break
      case gn:
        h = ((bn - rn) / d + 2) / 6
        break
      default:
        h = ((rn - gn) / d + 4) / 6
        break
    }
  }

  return [h * 360, s, l]
}

function hslToRgb(
  h: number,
  s: number,
  l: number,
): [number, number, number] {
  const hn = ((h % 360) + 360) % 360
  const sn = clamp(s, 0, 1)
  const ln = clamp(l, 0, 1)

  if (sn === 0) {
    const v = Math.round(ln * 255)
    return [v, v, v]
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t
    if (tt < 0) tt += 1
    if (tt > 1) tt -= 1
    if (tt < 1 / 6) return p + (q - p) * 6 * tt
    if (tt < 1 / 2) return q
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6
    return p
  }

  const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn
  const p = 2 * ln - q
  const hr = hn / 360

  const r = hue2rgb(p, q, hr + 1 / 3)
  const g = hue2rgb(p, q, hr)
  const b = hue2rgb(p, q, hr - 1 / 3)

  return [
    Math.round(clamp(r, 0, 1) * 255),
    Math.round(clamp(g, 0, 1) * 255),
    Math.round(clamp(b, 0, 1) * 255),
  ]
}

function toHex([r, g, b]: [number, number, number]): string {
  const h = (n: number) =>
    clamp(Math.round(n), 0, 255)
      .toString(16)
      .padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}`
}

/** Normaliza para #RRGGBB minúsculo ou retorna null. */
export function normalizeBrandHex(input: string): string | null {
  const t = input.trim()
  const withHash = t.startsWith('#') ? t : `#${t}`
  const rgb = hexToRgb(withHash)
  if (!rgb) return null
  return toHex(rgb).toLowerCase()
}

const LIGHTNESS_BY_SHADE: Record<PrimaryShade, number> = {
  '50': 0.97,
  '100': 0.93,
  '200': 0.86,
  '300': 0.76,
  '400': 0.65,
  '500': 0.55,
  '600': 0.48,
  '700': 0.4,
  '800': 0.32,
  '900': 0.26,
  '950': 0.18,
}

const SATURATION_FACTOR_BY_SHADE: Record<PrimaryShade, number> = {
  '50': 0.35,
  '100': 0.45,
  '200': 0.55,
  '300': 0.7,
  '400': 0.85,
  '500': 0.95,
  '600': 1,
  '700': 1,
  '800': 0.95,
  '900': 0.85,
  '950': 0.75,
}

/**
 * Gera escala primary (50–950) ancorada na cor escolhida como 600,
 * preservando matiz aproximado do usuário.
 */
export function buildPrimaryScale(baseHex: string): Record<PrimaryShade, string> {
  const normalized = normalizeBrandHex(baseHex) ?? DEFAULT_PRIMARY_HEX
  const rgb = hexToRgb(normalized)!
  const [h, s0] = rgbToHsl(...rgb)

  const out = {} as Record<PrimaryShade, string>
  for (const shade of SHADE_KEYS) {
    if (shade === '600') {
      out['600'] = normalized
      continue
    }
    const targetL = LIGHTNESS_BY_SHADE[shade]
    const sf = SATURATION_FACTOR_BY_SHADE[shade]
    const s = clamp(s0 * sf, 0, 0.95)
    out[shade] = toHex(hslToRgb(h, s, targetL))
  }
  return out
}

const CSS_VAR_BY_SHADE: Record<PrimaryShade, string> = {
  '50': '--pc-50',
  '100': '--pc-100',
  '200': '--pc-200',
  '300': '--pc-300',
  '400': '--pc-400',
  '500': '--pc-500',
  '600': '--pc-600',
  '700': '--pc-700',
  '800': '--pc-800',
  '900': '--pc-900',
  '950': '--pc-950',
}

export function applyPrimaryCssVariables(baseHex: string, root: HTMLElement = document.documentElement) {
  const scale = buildPrimaryScale(baseHex)
  for (const shade of SHADE_KEYS) {
    root.style.setProperty(CSS_VAR_BY_SHADE[shade], scale[shade])
  }
}

export function resetPrimaryCssVariables(root: HTMLElement = document.documentElement) {
  applyPrimaryCssVariables(DEFAULT_PRIMARY_HEX, root)
}
