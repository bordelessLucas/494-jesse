import { buscarTenantUserIdParaBranding } from '../auth/contaMembroDb'
import { supabase } from '../supabase'
import type { ConselhoClasseEspecialidade, EspecialidadeRow } from './especialidadesTypes'

async function tenantId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Sessão inválida.')
  return buscarTenantUserIdParaBranding(user.id)
}

export async function listarEspecialidades(): Promise<EspecialidadeRow[]> {
  const user_id = await tenantId()
  const { data, error } = await supabase
    .from('especialidades')
    .select(
      'id, user_id, nome, conselho_classe, valor_base_hora, ativo, created_at, updated_at',
    )
    .eq('user_id', user_id)
    .order('nome')

  if (error) {
    if (error.message.includes('especialidades') || error.message.includes('schema')) {
      throw new Error(
        'Tabela especialidades não encontrada. Aplique a migração 20260701130000_especialidades_visualizador.sql.',
      )
    }
    throw new Error(error.message)
  }

  return (data ?? []) as EspecialidadeRow[]
}

export async function salvarEspecialidade(input: {
  id?: string
  nome: string
  conselho_classe: ConselhoClasseEspecialidade
  valor_base_hora: number
  ativo: boolean
}): Promise<EspecialidadeRow> {
  const user_id = await tenantId()
  const payload = {
    user_id,
    nome: input.nome.trim(),
    conselho_classe: input.conselho_classe,
    valor_base_hora: input.valor_base_hora,
    ativo: input.ativo,
    updated_at: new Date().toISOString(),
  }

  if (input.id) {
    const { data, error } = await supabase
      .from('especialidades')
      .update(payload)
      .eq('id', input.id)
      .eq('user_id', user_id)
      .select(
        'id, user_id, nome, conselho_classe, valor_base_hora, ativo, created_at, updated_at',
      )
      .single()
    if (error) throw new Error(error.message)
    return data as EspecialidadeRow
  }

  const { data, error } = await supabase
    .from('especialidades')
    .insert(payload)
    .select(
      'id, user_id, nome, conselho_classe, valor_base_hora, ativo, created_at, updated_at',
    )
    .single()
  if (error) throw new Error(error.message)
  return data as EspecialidadeRow
}

export async function excluirEspecialidade(id: string): Promise<void> {
  const user_id = await tenantId()
  const { error } = await supabase.from('especialidades').delete().eq('id', id).eq('user_id', user_id)
  if (error) throw new Error(error.message)
}
