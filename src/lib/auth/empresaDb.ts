import { supabase } from '../supabase'
import { buscarTenantUserIdParaBranding } from './contaMembroDb'

export type EmpresaRow = {
  id: string
  owner_user_id: string
  nome: string
  created_at: string
  updated_at: string
}

export async function buscarEmpresaDoTenant(
  authUserId?: string,
): Promise<EmpresaRow | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const uid = authUserId ?? user?.id
  if (!uid) return null

  const tenantUserId = await buscarTenantUserIdParaBranding(uid)

  const { data, error } = await supabase
    .from('empresas')
    .select('id, owner_user_id, nome, created_at, updated_at')
    .eq('owner_user_id', tenantUserId)
    .maybeSingle()

  if (error) {
    if (error.message.includes('empresas') || error.message.includes('schema')) {
      return null
    }
    throw new Error(error.message)
  }

  return data as EmpresaRow | null
}

export async function atualizarNomeEmpresa(nome: string): Promise<EmpresaRow> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Sessão inválida.')

  const trimmed = nome.trim()
  if (!trimmed) throw new Error('Informe o nome da empresa.')

  const { data, error } = await supabase
    .from('empresas')
    .update({ nome: trimmed, updated_at: new Date().toISOString() })
    .eq('owner_user_id', user.id)
    .select('id, owner_user_id, nome, created_at, updated_at')
    .single()

  if (error) throw new Error(error.message)
  return data as EmpresaRow
}
