import { supabase } from '../supabase'

export type ContaMembroRow = {
  id: string
  tenant_user_id: string
  auth_user_id: string
  profissional_id: string
  role: 'profissional'
  permissoes: Record<string, boolean>
  must_change_password: boolean
}

export async function buscarTenantUserIdParaBranding(
  authUserId: string,
): Promise<string> {
  const { data, error } = await supabase
    .from('contas_membros')
    .select('tenant_user_id')
    .eq('auth_user_id', authUserId)
    .maybeSingle()

  if (error) {
    if (error.message.includes('contas_membros') || error.message.includes('schema')) {
      return authUserId
    }
    throw new Error(error.message)
  }

  return data?.tenant_user_id ?? authUserId
}

export async function buscarContaMembroAtual(
  authUserId: string,
): Promise<ContaMembroRow | null> {
  const { data, error } = await supabase
    .from('contas_membros')
    .select(
      'id, tenant_user_id, auth_user_id, profissional_id, role, permissoes, must_change_password',
    )
    .eq('auth_user_id', authUserId)
    .maybeSingle()

  if (error) {
    if (error.message.includes('contas_membros') || error.message.includes('schema')) {
      return null
    }
    throw new Error(error.message)
  }

  if (!data) return null

  return {
    id: data.id,
    tenant_user_id: data.tenant_user_id,
    auth_user_id: data.auth_user_id,
    profissional_id: data.profissional_id,
    role: 'profissional',
    permissoes: (data.permissoes as Record<string, boolean>) ?? {},
    must_change_password: data.must_change_password,
  }
}

export async function marcarSenhaAlterada(authUserId: string): Promise<void> {
  const { error } = await supabase
    .from('contas_membros')
    .update({
      must_change_password: false,
      updated_at: new Date().toISOString(),
    })
    .eq('auth_user_id', authUserId)

  if (error) throw new Error(error.message)
}

export async function buscarContaMembroPorProfissional(
  profissionalId: string,
): Promise<ContaMembroRow | null> {
  const { data, error } = await supabase
    .from('contas_membros')
    .select(
      'id, tenant_user_id, auth_user_id, profissional_id, role, permissoes, must_change_password',
    )
    .eq('profissional_id', profissionalId)
    .maybeSingle()

  if (error) {
    if (error.message.includes('contas_membros') || error.message.includes('schema')) {
      return null
    }
    throw new Error(error.message)
  }

  if (!data) return null

  return {
    id: data.id,
    tenant_user_id: data.tenant_user_id,
    auth_user_id: data.auth_user_id,
    profissional_id: data.profissional_id,
    role: 'profissional',
    permissoes: (data.permissoes as Record<string, boolean>) ?? {},
    must_change_password: data.must_change_password,
  }
}

export async function atualizarPermissoesPorProfissional(
  profissionalId: string,
  permissoes: Record<string, boolean>,
): Promise<void> {
  const { error } = await supabase
    .from('contas_membros')
    .update({
      permissoes,
      updated_at: new Date().toISOString(),
    })
    .eq('profissional_id', profissionalId)

  if (error) throw new Error(error.message)
}
