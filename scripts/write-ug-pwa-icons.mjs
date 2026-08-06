import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')

function stripSvgShell(svg) {
  return svg
    .replace(/<\?xml[^>]*>/i, '')
    .replace(/<svg[^>]*>/i, '')
    .replace(/<\/svg>\s*$/i, '')
    .trim()
}

function uniquifyIds(fragment, prefix) {
  return fragment
    .replace(/id="([^"]+)"/g, `id="${prefix}-$1"`)
    .replace(/url\(#([^)]+)\)/g, `url(#${prefix}-$1)`)
    .replace(/xlink:href="#([^"]+)"/g, `xlink:href="#${prefix}-$1"`)
    .replace(/href="#([^"]+)"/g, `href="#${prefix}-$1"`)
}

const symbolColor = uniquifyIds(
  stripSvgShell(readFileSync(join(publicDir, 'SVG/06_UG_Simbolo_Ciano.svg'), 'utf8')),
  'fav',
)
const symbolWhite = uniquifyIds(
  stripSvgShell(readFileSync(join(publicDir, 'SVG/11_UG_Simbolo_Branco.svg'), 'utf8')),
  'pwa',
)

const favicon = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#070b13"/>
  <g transform="translate(118,64) scale(1.01)">
    ${symbolColor}
  </g>
</svg>
`

const pwaIcon = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#134d65"/>
  <g transform="translate(118,64) scale(1.01)">
    ${uniquifyIds(stripSvgShell(readFileSync(join(publicDir, 'SVG/06_UG_Simbolo_Ciano.svg'), 'utf8')), 'icon')}
  </g>
</svg>
`

const maskable = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#0a939d"/>
  <g transform="translate(130,80) scale(0.92)">
    ${symbolWhite}
  </g>
</svg>
`

writeFileSync(join(publicDir, 'favicon.svg'), favicon)
writeFileSync(join(publicDir, 'pwa-icon.svg'), pwaIcon)
writeFileSync(join(publicDir, 'pwa-maskable-icon.svg'), maskable)
console.log('Ícones UG escritos em public/')
