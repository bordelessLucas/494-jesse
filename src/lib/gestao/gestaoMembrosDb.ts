import { buscarTenantUserIdParaBranding } from '../auth/contaMembroDb'
import type { ContaMembroRole } from '../auth/contaMembroDb'
import { supabase } from '../supabase'
import type { MembroGestaoLinha, PerfilGestaoMembro } from './gestaoMembroAcessoTypes'
import { chaveMarcadorPerfil, roleContaMembroPorPerfil } from './gestaoMembroAcessoTypes'

async function tenantId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Sessão inválida.')
  return buscarTenantUserIdParaBranding(user.id)
}

function mapLinha(row: {
  id: string
  auth_user_id: string
  profissional_id: string | null
  role: string
  nome: string | null
  email: string | null
  permissoes: unknown
  must_change_password: boolean
  created_at: string
}): MembroGestaoLinha {
  const permissoes = (row.permissoes as Record<string, boolean>) ?? {}
  return {
    id: row.id,
    auth_user_id: row.auth_user_id,
    profissional_id: row.profissional_id,
    role: row.role as ContaMembroRole,
    nome: row.nome?.trim() || '—',
    email: row.email?.trim() || '—',
    permissoes,
    must_change_password: row.must_change_password,
    created_at: row.created_at,
  }
}

export async function listarMembrosGestao(perfil: PerfilGestaoMembro): Promise<MembroGestaoLinha[]> {
  const tenant_user_id = await tenantId()
  const role = roleContaMembroPorPerfil(perfil)
  const marcador = chaveMarcadorPerfil(perfil)

  const { data, error } = await supabase
    .from('contas_membros')
    .select(
      'id, auth_user_id, profissional_id, role, nome, email, permissoes, must_change_password, created_at',
    )
    .eq('tenant_user_id', tenant_user_id)
    .eq('role', role)
    .order('created_at', { ascending: false })

  if (error) {
    if (error.message.includes('contas_membros') || error.message.includes('schema')) {
      throw new Error('Tabela contas_membros não encontrada.')
    }
    throw new Error(error.message)
  }

  return (data ?? []).map(mapLinha).filter((m) => Boolean(m.permissoes[marcador]))
}

export async function atualizarPermissoesMembroGestao(
  membroId: string,
  permissoes: Record<string, boolean>,
): Promise<void> {
  const tenant_user_id = await tenantId()
  const { error } = await supabase
    .from('contas_membros')
    .update({
      permissoes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', membroId)
    .eq('tenant_user_id', tenant_user_id)

  if (error) throw new Error(error.message)
}

export async function excluirMembroGestao(membroId: string): Promise<void> {
  const tenant_user_id = await tenantId()
  const { error } = await supabase
    .from('contas_membros')
    .delete()
    .eq('id', membroId)
    .eq('tenant_user_id', tenant_user_id)

  if (error) throw new Error(error.message)
}
