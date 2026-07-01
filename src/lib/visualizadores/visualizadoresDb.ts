import { buscarTenantUserIdParaBranding } from '../auth/contaMembroDb'
import { supabase } from '../supabase'
import { CHAVE_GESTAO_VISUALIZADOR, type VisualizadorLinha } from './visualizadorTypes'

async function tenantId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Sessão inválida.')
  return buscarTenantUserIdParaBranding(user.id)
}

export async function listarVisualizadores(): Promise<VisualizadorLinha[]> {
  const tenant_user_id = await tenantId()
  const { data, error } = await supabase
    .from('contas_membros')
    .select(
      'id, auth_user_id, role, nome, email, permissoes, must_change_password, created_at',
    )
    .eq('tenant_user_id', tenant_user_id)
    .eq('role', 'visualizador')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  return (data ?? [])
    .map((row) => ({
      id: row.id,
      auth_user_id: row.auth_user_id,
      role: row.role as VisualizadorLinha['role'],
      nome: row.nome?.trim() || '—',
      email: row.email?.trim() || '—',
      permissoes: (row.permissoes as Record<string, boolean>) ?? {},
      must_change_password: row.must_change_password,
      created_at: row.created_at,
    }))
    .filter((v) => Boolean(v.permissoes[CHAVE_GESTAO_VISUALIZADOR]))
}

export async function atualizarPermissoesVisualizador(
  membroId: string,
  permissoes: Record<string, boolean>,
): Promise<void> {
  const tenant_user_id = await tenantId()
  const { error } = await supabase
    .from('contas_membros')
    .update({ permissoes, updated_at: new Date().toISOString() })
    .eq('id', membroId)
    .eq('tenant_user_id', tenant_user_id)

  if (error) throw new Error(error.message)
}

export async function excluirVisualizador(membroId: string): Promise<void> {
  const tenant_user_id = await tenantId()
  const { error } = await supabase
    .from('contas_membros')
    .delete()
    .eq('id', membroId)
    .eq('tenant_user_id', tenant_user_id)

  if (error) throw new Error(error.message)
}
