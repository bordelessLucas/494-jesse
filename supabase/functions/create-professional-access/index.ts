import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

const DEFAULT_MEMBER_PASSWORD = 'PlantaoCheck@'

type CreateProfessionalAccessBody = {
  profissionalId: string
  email: string
  nome: string
  permissoes: Record<string, boolean>
  senha?: string
}

const PLANTAOCHECK_SERVICE_ROLE_SECRET = 'PLANTAOCHECK_SERVICE_ROLE_KEY'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get(PLANTAOCHECK_SERVICE_ROLE_SECRET)
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      return json({ error: 'Configuração do servidor incompleta.' }, 500)
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return json({ error: 'Não autenticado.' }, 401)
    }

    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    const {
      data: { user: caller },
      error: userError,
    } = await supabaseUser.auth.getUser()

    if (userError || !caller) {
      return json({ error: 'Sessão inválida.' }, 401)
    }

    const { data: membroCaller } = await supabaseAdmin
      .from('contas_membros')
      .select('id')
      .eq('auth_user_id', caller.id)
      .maybeSingle()

    if (membroCaller) {
      return json(
        { error: 'Apenas o MASTER da empresa pode criar acessos de funcionários.' },
        403,
      )
    }

    const body = (await req.json()) as CreateProfessionalAccessBody
    const email = body.email?.trim().toLowerCase()
    const nome = body.nome?.trim()
    const profissionalId = body.profissionalId?.trim()
    const permissoes = body.permissoes ?? {}
    const senha = (body.senha?.trim() || DEFAULT_MEMBER_PASSWORD).slice(0, 72)

    if (!email || !nome || !profissionalId) {
      return json({ error: 'E-mail, nome e profissional são obrigatórios.' }, 400)
    }

    const { data: profissional, error: profError } = await supabaseAdmin
      .from('profissionais')
      .select('id, user_id, auth_user_id, email, nome')
      .eq('id', profissionalId)
      .eq('user_id', caller.id)
      .maybeSingle()

    if (profError || !profissional) {
      return json({ error: 'Profissional não encontrado nesta conta.' }, 404)
    }

    if (profissional.auth_user_id) {
      return json({ error: 'Este profissional já possui acesso criado.' }, 409)
    }

    const { data: authUser, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password: senha,
        email_confirm: true,
        user_metadata: {
          full_name: nome,
          role: 'funcionario',
          tenant_user_id: caller.id,
          profissional_id: profissionalId,
          must_change_password: true,
        },
      })

    if (createError || !authUser.user) {
      const msg = createError?.message ?? 'Erro ao criar utilizador.'
      if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('registered')) {
        return json(
          {
            error:
              'Já existe uma conta com este e-mail. Use outro e-mail ou recupere a senha existente.',
          },
          409,
        )
      }
      return json({ error: msg }, 400)
    }

    const authUserId = authUser.user.id
    const agora = new Date().toISOString()

    const { error: membroError } = await supabaseAdmin.from('contas_membros').insert({
      tenant_user_id: caller.id,
      auth_user_id: authUserId,
      profissional_id: profissionalId,
      role: 'profissional',
      permissoes,
      must_change_password: true,
      updated_at: agora,
    })

    if (membroError) {
      await supabaseAdmin.auth.admin.deleteUser(authUserId)
      return json({ error: membroError.message }, 400)
    }

    const { error: updateProfError } = await supabaseAdmin
      .from('profissionais')
      .update({
        auth_user_id: authUserId,
        email,
        updated_at: agora,
      })
      .eq('id', profissionalId)
      .eq('user_id', caller.id)

    if (updateProfError) {
      await supabaseAdmin.from('contas_membros').delete().eq('auth_user_id', authUserId)
      await supabaseAdmin.auth.admin.deleteUser(authUserId)
      return json({ error: updateProfError.message }, 400)
    }

    return json({
      authUserId,
      senhaInicial: senha === DEFAULT_MEMBER_PASSWORD ? DEFAULT_MEMBER_PASSWORD : undefined,
      mensagem:
        'Acesso criado. O profissional deve entrar com o e-mail informado e alterar a senha no primeiro acesso.',
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro interno.'
    return json({ error: msg }, 500)
  }
})

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
