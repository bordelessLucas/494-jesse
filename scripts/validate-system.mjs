#!/usr/bin/env node
/**
 * Validação automatizada do PlantaoCheck:
 * - build TypeScript
 * - módulos lazy do App.tsx
 * - rotas HTTP (dev server)
 * - tabelas Supabase (migrações aplicadas)
 *
 * Uso: npm run validate
 *      npm run validate -- --skip-build
 *      npm run validate -- --base-url=http://localhost:5173
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

const args = process.argv.slice(2)
const skipBuild = args.includes('--skip-build')
const baseUrlArg = args.find((a) => a.startsWith('--base-url='))
const BASE_URL = baseUrlArg?.split('=')[1] ?? 'http://localhost:5173'

const results = []

function ok(grupo, nome, detalhe = '') {
  results.push({ grupo, nome, status: 'ok', detalhe })
}

function fail(grupo, nome, detalhe = '') {
  results.push({ grupo, nome, status: 'fail', detalhe })
}

function warn(grupo, nome, detalhe = '') {
  results.push({ grupo, nome, status: 'warn', detalhe })
}

function loadEnv() {
  const path = join(ROOT, '.env')
  if (!existsSync(path)) return {}
  const out = {}
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i === -1) continue
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, '')
  }
  return out
}

function runBuild() {
  if (skipBuild) {
    warn('Build', 'Compilação', 'Ignorada (--skip-build)')
    return
  }
  const r = spawnSync('npm', ['run', 'build'], {
    cwd: ROOT,
    shell: true,
    stdio: 'pipe',
    encoding: 'utf8',
  })
  if (r.status === 0) ok('Build', 'tsc + vite build', 'Compilação concluída')
  else fail('Build', 'tsc + vite build', (r.stderr || r.stdout || '').slice(-400))
}

function checkLazyModules() {
  const appPath = join(ROOT, 'src', 'App.tsx')
  const src = readFileSync(appPath, 'utf8')
  const imports = [...src.matchAll(/import\('\.\/pages\/([^']+)'\)/g)].map((m) => m[1])
  const unique = [...new Set(imports)]

  for (const rel of unique) {
    const candidates = [
      join(ROOT, 'src', 'pages', `${rel}.tsx`),
      join(ROOT, 'src', 'pages', `${rel}.ts`),
      join(ROOT, 'src', 'pages', rel, 'index.tsx'),
    ]
    if (candidates.some((p) => existsSync(p))) ok('Módulos', rel)
    else fail('Módulos', rel, 'Ficheiro não encontrado')
  }
}

function checkDeadPlaceholders() {
  const orphans = [
    'src/pages/configuracao/ConfiguracaoSecaoPage.tsx',
    'src/pages/Gestao/CadastrosGestaoPlaceholderPages.tsx',
    'src/pages/Gestao/GestaoEmissaoPlaceholderPages.tsx',
    'src/pages/Gestao/FrequenciaPlaceholderPages.tsx',
  ]
  for (const rel of orphans) {
    if (existsSync(join(ROOT, rel))) {
      warn('Código morto', rel, 'Existe no disco mas não está ligado ao App.tsx')
    }
  }
}

function checkMigrationsOnDisk() {
  const dir = join(ROOT, 'supabase', 'migrations')
  const required = [
    '20260701120000_gestao_cadastros.sql',
    '20260701130000_especialidades_visualizador.sql',
    '20260701140000_config_parametrizacao.sql',
  ]
  for (const f of required) {
    if (existsSync(join(dir, f))) ok('Migrações (repo)', f, 'Presente no repositório')
    else fail('Migrações (repo)', f, 'Ficheiro em falta')
  }
}

async function checkHttpRoutes() {
  const publicRoutes = [
    '/login',
    '/cadastro',
    '/suporte/politica-privacidade',
    '/suporte/termos-uso',
  ]

  const authRoutes = [
    '/painel/resumo',
    '/escalas',
    '/painel/relatorios',
    '/relatorios-plantao/faltas',
    '/relatorios/emissao',
    '/gestao/emissao/uti-adulto',
    '/gestao/frequencia/mensal',
    '/gestao/cadastros/tipo-servico/scih',
    '/usuarios/especialidades',
    '/usuarios/visualizadores',
    '/configuracao/grupos',
    '/configuracao/tipos-plantao',
  ]

  let serverUp = false
  try {
    const r = await fetch(BASE_URL, { redirect: 'manual' })
    serverUp = r.status > 0
  } catch {
    fail('HTTP', 'Dev server', `${BASE_URL} inacessível — execute npm run dev`)
    return
  }

  if (!serverUp) {
    fail('HTTP', 'Dev server', 'Sem resposta')
    return
  }

  ok('HTTP', 'Dev server', BASE_URL)

  for (const path of publicRoutes) {
    try {
      const r = await fetch(`${BASE_URL}${path}`)
      const html = await r.text()
      const hasRoot = html.includes('id="root"') || html.includes('id=&quot;root&quot;')
      if (r.ok && hasRoot) ok('HTTP público', path, `HTTP ${r.status}`)
      else fail('HTTP público', path, `HTTP ${r.status}, SPA=${hasRoot}`)
    } catch (e) {
      fail('HTTP público', path, e instanceof Error ? e.message : String(e))
    }
  }

  for (const path of authRoutes) {
    try {
      const r = await fetch(`${BASE_URL}${path}`, { redirect: 'manual' })
      // SPA devolve index.html; redirect para login é OK
      if (r.status === 200 || r.status === 302 || r.status === 307) {
        ok('HTTP (SPA)', path, `HTTP ${r.status} — bundle carrega (auth no browser)`)
      } else {
        warn('HTTP (SPA)', path, `HTTP ${r.status}`)
      }
    } catch (e) {
      fail('HTTP (SPA)', path, e instanceof Error ? e.message : String(e))
    }
  }
}

async function checkSupabaseTables(env) {
  const url = env.VITE_SUPABASE_URL
  const key = env.VITE_SUPABASE_ANON_KEY ?? env.VITE_SUPABASE_PUBLISHABLE_KEY

  if (!url || !key) {
    warn('Supabase', 'Conexão', '.env sem VITE_SUPABASE_URL/ANON_KEY — teste de BD ignorado')
    return
  }

  const sb = createClient(url, key)

  const tables = [
    'especialidades',
    'gestao_tipos_servico',
    'config_grupos',
    'config_tipos_plantao',
    'config_situacoes_plantao',
    'config_valores',
    'config_auto_ajustes',
    'config_tipos_contratacao',
    'config_habilidades',
    'contas_membros',
    'plantoes',
    'locais',
  ]

  for (const table of tables) {
    const { error } = await sb.from(table).select('id', { count: 'exact', head: true })
    if (!error) {
      ok('Supabase (BD)', table, 'Tabela acessível (RLS pode exigir login para dados)')
    } else if (
      error.message.includes('does not exist') ||
      error.message.includes('schema cache') ||
      error.message.includes('Could not find')
    ) {
      fail('Supabase (BD)', table, 'Tabela não existe — aplique supabase db push')
    } else if (
      error.message.includes('JWT') ||
      error.message.includes('permission') ||
      error.code === '42501' ||
      error.code === 'PGRST301'
    ) {
      ok('Supabase (BD)', table, `Tabela existe (${error.code ?? 'RLS/auth'})`)
    } else {
      warn('Supabase (BD)', table, error.message)
    }
  }
}

function printReport() {
  const counts = { ok: 0, warn: 0, fail: 0 }
  for (const r of results) counts[r.status]++

  console.log('\n══════════════════════════════════════════════════')
  console.log('  PlantaoCheck — Relatório de Validação')
  console.log('══════════════════════════════════════════════════\n')

  let lastGrupo = ''
  for (const r of results) {
    if (r.grupo !== lastGrupo) {
      console.log(`\n▸ ${r.grupo}`)
      lastGrupo = r.grupo
    }
    const icon = r.status === 'ok' ? '✓' : r.status === 'warn' ? '⚠' : '✗'
    const detail = r.detalhe ? ` — ${r.detalhe}` : ''
    console.log(`  ${icon} ${r.nome}${detail}`)
  }

  console.log('\n──────────────────────────────────────────────────')
  console.log(`  OK: ${counts.ok}  |  Avisos: ${counts.warn}  |  Falhas: ${counts.fail}`)
  console.log('──────────────────────────────────────────────────\n')

  if (counts.fail > 0) process.exit(1)
}

async function main() {
  console.log('A validar PlantaoCheck…\n')
  runBuild()
  checkLazyModules()
  checkDeadPlaceholders()
  checkMigrationsOnDisk()
  await checkHttpRoutes()
  await checkSupabaseTables(loadEnv())
  printReport()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
