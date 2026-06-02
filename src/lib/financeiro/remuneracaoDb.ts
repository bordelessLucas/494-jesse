import { buscarTenantUserIdParaBranding } from '../auth/contaMembroDb'
import { supabase } from '../supabase'
import type {
  AcrescimoRemuneracao,
  FeriadoRemuneracao,
  GatilhoAcrescimo,
  RegrasRemuneracao,
  TipoCalculoAcrescimo,
  TipoPlantaoRemuneracao,
} from './remuneracaoTypes'

async function tenantId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Sessão inválida.')
  return buscarTenantUserIdParaBranding(user.id)
}

export async function buscarRegrasRemuneracao(
  tenantUserId?: string,
): Promise<RegrasRemuneracao> {
  const uid = tenantUserId ?? (await tenantId())

  const [tiposRes, acrescimosRes, feriadosRes] = await Promise.all([
    supabase
      .from('remuneracao_tipos_plantao')
      .select('id, user_id, nome, descricao, multiplicador, ativo, ordem')
      .eq('user_id', uid)
      .order('ordem')
      .order('nome'),
    supabase
      .from('remuneracao_acrescimos')
      .select(
        'id, user_id, nome, tipo_calculo, valor, gatilho, especialidade_contem, ativo, ordem',
      )
      .eq('user_id', uid)
      .order('ordem')
      .order('nome'),
    supabase
      .from('remuneracao_feriados')
      .select('id, user_id, data_feriado, nome')
      .eq('user_id', uid)
      .order('data_feriado'),
  ])

  if (tiposRes.error && !tiposRes.error.message.includes('remuneracao')) {
    throw new Error(tiposRes.error.message)
  }
  if (acrescimosRes.error && !acrescimosRes.error.message.includes('remuneracao')) {
    throw new Error(acrescimosRes.error.message)
  }
  if (feriadosRes.error && !feriadosRes.error.message.includes('remuneracao')) {
    throw new Error(feriadosRes.error.message)
  }

  return {
    tiposPlantao: (tiposRes.data ?? []) as TipoPlantaoRemuneracao[],
    acrescimos: (acrescimosRes.data ?? []) as AcrescimoRemuneracao[],
    feriados: (feriadosRes.data ?? []) as FeriadoRemuneracao[],
  }
}

export async function salvarTipoPlantaoRemuneracao(input: {
  id?: string
  nome: string
  descricao?: string | null
  multiplicador: number
  ativo: boolean
  ordem?: number
}): Promise<TipoPlantaoRemuneracao> {
  const user_id = await tenantId()
  const payload = {
    user_id,
    nome: input.nome.trim(),
    descricao: input.descricao?.trim() || null,
    multiplicador: input.multiplicador,
    ativo: input.ativo,
    ordem: input.ordem ?? 0,
    updated_at: new Date().toISOString(),
  }

  if (input.id) {
    const { data, error } = await supabase
      .from('remuneracao_tipos_plantao')
      .update(payload)
      .eq('id', input.id)
      .eq('user_id', user_id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data as TipoPlantaoRemuneracao
  }

  const { data, error } = await supabase
    .from('remuneracao_tipos_plantao')
    .insert(payload)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as TipoPlantaoRemuneracao
}

export async function excluirTipoPlantaoRemuneracao(id: string): Promise<void> {
  const user_id = await tenantId()
  const { error } = await supabase
    .from('remuneracao_tipos_plantao')
    .delete()
    .eq('id', id)
    .eq('user_id', user_id)
  if (error) throw new Error(error.message)
}

export async function salvarAcrescimoRemuneracao(input: {
  id?: string
  nome: string
  tipo_calculo: TipoCalculoAcrescimo
  valor: number
  gatilho: GatilhoAcrescimo
  especialidade_contem?: string | null
  ativo: boolean
  ordem?: number
}): Promise<AcrescimoRemuneracao> {
  const user_id = await tenantId()
  const payload = {
    user_id,
    nome: input.nome.trim(),
    tipo_calculo: input.tipo_calculo,
    valor: input.valor,
    gatilho: input.gatilho,
    especialidade_contem:
      input.gatilho === 'especialidade'
        ? input.especialidade_contem?.trim() || null
        : null,
    ativo: input.ativo,
    ordem: input.ordem ?? 0,
    updated_at: new Date().toISOString(),
  }

  if (input.id) {
    const { data, error } = await supabase
      .from('remuneracao_acrescimos')
      .update(payload)
      .eq('id', input.id)
      .eq('user_id', user_id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data as AcrescimoRemuneracao
  }

  const { data, error } = await supabase
    .from('remuneracao_acrescimos')
    .insert(payload)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as AcrescimoRemuneracao
}

export async function excluirAcrescimoRemuneracao(id: string): Promise<void> {
  const user_id = await tenantId()
  const { error } = await supabase
    .from('remuneracao_acrescimos')
    .delete()
    .eq('id', id)
    .eq('user_id', user_id)
  if (error) throw new Error(error.message)
}

export async function salvarFeriadoRemuneracao(input: {
  id?: string
  data_feriado: string
  nome: string
}): Promise<FeriadoRemuneracao> {
  const user_id = await tenantId()
  const payload = {
    user_id,
    data_feriado: input.data_feriado,
    nome: input.nome.trim() || 'Feriado',
  }

  if (input.id) {
    const { data, error } = await supabase
      .from('remuneracao_feriados')
      .update(payload)
      .eq('id', input.id)
      .eq('user_id', user_id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data as FeriadoRemuneracao
  }

  const { data, error } = await supabase
    .from('remuneracao_feriados')
    .insert(payload)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as FeriadoRemuneracao
}

export async function excluirFeriadoRemuneracao(id: string): Promise<void> {
  const user_id = await tenantId()
  const { error } = await supabase
    .from('remuneracao_feriados')
    .delete()
    .eq('id', id)
    .eq('user_id', user_id)
  if (error) throw new Error(error.message)
}
