import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')

const targets = [
  { input: 'pwa-icon.svg', output: 'pwa-192x192.png', size: 192 },
  { input: 'pwa-icon.svg', output: 'pwa-512x512.png', size: 512 },
  { input: 'pwa-icon.svg', output: 'apple-touch-icon.png', size: 180 },
  { input: 'pwa-maskable-icon.svg', output: 'pwa-maskable-512x512.png', size: 512 },
]

for (const { input, output, size } of targets) {
  const inputPath = join(publicDir, input)
  if (!existsSync(inputPath)) {
    console.error(`Arquivo não encontrado: ${inputPath}`)
    process.exit(1)
  }

  const svg = readFileSync(inputPath)
  await sharp(svg).resize(size, size).png().toFile(join(publicDir, output))
  console.log(`Gerado ${output} (${size}x${size})`)
}
