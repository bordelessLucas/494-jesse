import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

function loadEnv(path) {
  const out = {}
  for (const line of fs.readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (!m) continue
    let v = m[2].trim()
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1)
    }
    out[m[1]] = v
  }
  return out
}

const env = loadEnv('.env')
const url = env.VITE_SUPABASE_URL
const key = env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  console.error('Missing Supabase env')
  process.exit(1)
}

const stamp = Date.now().toString(36)
const email = `teste.ug.${stamp}@example.com`
const password = 'UniqueGestor@2026'
const fullName = 'Usuario Teste UG'
const companyName = 'Empresa Teste Unique Gestor'

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      full_name: fullName,
      company_name: companyName,
      role: 'master',
    },
  },
})

if (error) {
  console.error('SIGNUP_ERROR', error.message)
  process.exit(1)
}

console.log(
  JSON.stringify(
    {
      ok: true,
      email,
      password,
      userId: data.user?.id ?? null,
      hasSession: Boolean(data.session),
      emailConfirmed: Boolean(data.user?.email_confirmed_at),
      identities: data.user?.identities?.length ?? 0,
      note: data.session
        ? 'Conta pronta para login imediato.'
        : 'Cadastro criado, mas sem sessao — pode exigir confirmacao de e-mail no Supabase.',
    },
    null,
    2,
  ),
)
