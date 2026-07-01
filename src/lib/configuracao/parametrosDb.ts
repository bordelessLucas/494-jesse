import { buscarTenantUserIdParaBranding } from '../auth/contaMembroDb'
import { supabase } from '../supabase'
import {
  SECOES_POR_SLUG,
  type ParametroRow,
  type ParametroSecaoSlug,
} from './parametrosConfig'

const MIGRACAO = '20260701140000_config_parametrizacao.sql'

/** Acesso dinâmico às tabelas config_* até regenerar database.types. */
function fromConfigTabela(tabela: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from(tabela)
}

async function tenantId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Sessão inválida.')
  return buscarTenantUserIdParaBranding(user.id)
}

function erroAmigavel(error: { message: string }, tabela: string): Error {
  if (error.message.includes(tabela) || error.message.includes('schema')) {
    return new Error(`Tabela ${tabela} não encontrada. Aplique a migração ${MIGRACAO}.`)
  }
  return new Error(error.message)
}

export async function listarParametros(secao: ParametroSecaoSlug): Promise<ParametroRow[]> {
  const config = SECOES_POR_SLUG[secao]
  const user_id = await tenantId()
  const { data, error } = await fromConfigTabela(config.tabela)
    .select('*')
    .eq('user_id', user_id)
    .order('ordem')

  if (error) throw erroAmigavel(error, config.tabela)
  return (data ?? []) as unknown as ParametroRow[]
}

export async function salvarParametro(
  secao: ParametroSecaoSlug,
  input: { id?: string; payload: Record<string, unknown> },
): Promise<ParametroRow> {
  const config = SECOES_POR_SLUG[secao]
  const user_id = await tenantId()
  const payload = {
    user_id,
    ...input.payload,
    updated_at: new Date().toISOString(),
  }

  if (input.id) {
    const { data, error } = await fromConfigTabela(config.tabela)
      .update(payload)
      .eq('id', input.id)
      .eq('user_id', user_id)
      .select('*')
      .single()
    if (error) throw erroAmigavel(error, config.tabela)
    return data as unknown as ParametroRow
  }

  const { data, error } = await fromConfigTabela(config.tabela)
    .insert(payload)
    .select('*')
    .single()
  if (error) throw erroAmigavel(error, config.tabela)
  return data as unknown as ParametroRow
}

export async function excluirParametro(secao: ParametroSecaoSlug, id: string): Promise<void> {
  const config = SECOES_POR_SLUG[secao]
  const user_id = await tenantId()
  const { error } = await fromConfigTabela(config.tabela)
    .delete()
    .eq('id', id)
    .eq('user_id', user_id)
  if (error) throw erroAmigavel(error, config.tabela)
}
