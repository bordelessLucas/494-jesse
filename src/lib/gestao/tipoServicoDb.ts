import { buscarTenantUserIdParaBranding } from '../auth/contaMembroDb'
import { supabase } from '../supabase'
import type {
  AcrescimoTipoServicoGestao,
  ConfigTipoServicoCompleta,
  SetorTipoServicoGestao,
  SlugTipoServicoGestao,
  TipoCalculoAcrescimoGestao,
  TipoServicoGestao,
} from './tipoServicoTypes'
import { ROTULOS_TIPO_SERVICO } from './tipoServicoTypes'

async function tenantId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Sessão inválida.')
  return buscarTenantUserIdParaBranding(user.id)
}

export async function buscarConfigTipoServico(
  slug: SlugTipoServicoGestao,
): Promise<ConfigTipoServicoCompleta> {
  const user_id = await tenantId()

  let { data: tipo, error: tipoError } = await supabase
    .from('gestao_tipos_servico')
    .select('id, user_id, slug, titulo, observacoes, ativo')
    .eq('user_id', user_id)
    .eq('slug', slug)
    .maybeSingle()

  if (tipoError) {
    if (
      tipoError.message.includes('gestao_tipos_servico') ||
      tipoError.message.includes('schema')
    ) {
      throw new Error(
        'Tabelas de tipo de serviço não encontradas. Aplique a migração 20260701120000_gestao_cadastros.sql.',
      )
    }
    throw new Error(tipoError.message)
  }

  if (!tipo) {
    const { data: criado, error: criarError } = await supabase
      .from('gestao_tipos_servico')
      .insert({
        user_id,
        slug,
        titulo: ROTULOS_TIPO_SERVICO[slug],
        ativo: true,
        updated_at: new Date().toISOString(),
      })
      .select('id, user_id, slug, titulo, observacoes, ativo')
      .single()

    if (criarError) throw new Error(criarError.message)
    tipo = criado
  }

  if (!tipo) {
    throw new Error('Não foi possível inicializar o tipo de serviço.')
  }

  const tipoId = tipo.id

  const [acrescimosRes, setoresRes] = await Promise.all([
    supabase
      .from('gestao_tipo_servico_acrescimos')
      .select(
        'id, user_id, tipo_servico_id, especialidade, tipo_calculo, valor, ativo, ordem',
      )
      .eq('tipo_servico_id', tipoId)
      .order('ordem')
      .order('especialidade'),
    supabase
      .from('gestao_tipo_servico_setores')
      .select('id, user_id, tipo_servico_id, setor_id')
      .eq('tipo_servico_id', tipoId),
  ])
  if (acrescimosRes.error) throw new Error(acrescimosRes.error.message)
  if (setoresRes.error) throw new Error(setoresRes.error.message)

  const setores: SetorTipoServicoGestao[] = (setoresRes.data ?? []).map((row) => ({
    id: row.id,
    user_id: row.user_id,
    tipo_servico_id: row.tipo_servico_id,
    setor_id: row.setor_id,
  }))

  return {
    tipo: tipo as TipoServicoGestao,
    acrescimos: (acrescimosRes.data ?? []) as AcrescimoTipoServicoGestao[],
    setores,
  }
}

export async function salvarTipoServicoGestao(input: {
  id: string
  titulo: string
  observacoes?: string | null
  ativo: boolean
}): Promise<TipoServicoGestao> {
  const user_id = await tenantId()
  const { data, error } = await supabase
    .from('gestao_tipos_servico')
    .update({
      titulo: input.titulo.trim(),
      observacoes: input.observacoes?.trim() || null,
      ativo: input.ativo,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.id)
    .eq('user_id', user_id)
    .select('id, user_id, slug, titulo, observacoes, ativo')
    .single()

  if (error) throw new Error(error.message)
  return data as TipoServicoGestao
}

export async function salvarAcrescimoTipoServico(input: {
  id?: string
  tipo_servico_id: string
  especialidade: string
  tipo_calculo: TipoCalculoAcrescimoGestao
  valor: number
  ativo: boolean
  ordem?: number
}): Promise<AcrescimoTipoServicoGestao> {
  const user_id = await tenantId()
  const payload = {
    user_id,
    tipo_servico_id: input.tipo_servico_id,
    especialidade: input.especialidade.trim(),
    tipo_calculo: input.tipo_calculo,
    valor: input.valor,
    ativo: input.ativo,
    ordem: input.ordem ?? 0,
    updated_at: new Date().toISOString(),
  }

  if (input.id) {
    const { data, error } = await supabase
      .from('gestao_tipo_servico_acrescimos')
      .update(payload)
      .eq('id', input.id)
      .eq('user_id', user_id)
      .select(
        'id, user_id, tipo_servico_id, especialidade, tipo_calculo, valor, ativo, ordem',
      )
      .single()
    if (error) throw new Error(error.message)
    return data as AcrescimoTipoServicoGestao
  }

  const { data, error } = await supabase
    .from('gestao_tipo_servico_acrescimos')
    .insert(payload)
    .select(
      'id, user_id, tipo_servico_id, especialidade, tipo_calculo, valor, ativo, ordem',
    )
    .single()
  if (error) throw new Error(error.message)
  return data as AcrescimoTipoServicoGestao
}

export async function excluirAcrescimoTipoServico(id: string): Promise<void> {
  const user_id = await tenantId()
  const { error } = await supabase
    .from('gestao_tipo_servico_acrescimos')
    .delete()
    .eq('id', id)
    .eq('user_id', user_id)
  if (error) throw new Error(error.message)
}

export async function vincularSetorTipoServico(input: {
  tipo_servico_id: string
  setor_id: string
}): Promise<SetorTipoServicoGestao> {
  const user_id = await tenantId()
  const { data, error } = await supabase
    .from('gestao_tipo_servico_setores')
    .insert({
      user_id,
      tipo_servico_id: input.tipo_servico_id,
      setor_id: input.setor_id,
    })
    .select('id, user_id, tipo_servico_id, setor_id')
    .single()

  if (error) {
    if (error.message.includes('unique') || error.code === '23505') {
      throw new Error('Este setor já está vinculado a este tipo de serviço.')
    }
    throw new Error(error.message)
  }

  return {
    id: data.id,
    user_id: data.user_id,
    tipo_servico_id: data.tipo_servico_id,
    setor_id: data.setor_id,
  }
}

export async function desvincularSetorTipoServico(id: string): Promise<void> {
  const user_id = await tenantId()
  const { error } = await supabase
    .from('gestao_tipo_servico_setores')
    .delete()
    .eq('id', id)
    .eq('user_id', user_id)
  if (error) throw new Error(error.message)
}
