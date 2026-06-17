import { supabase } from '../supabase'
import type { Notificacao, TipoNotificacao } from '../../types/notificacaoTypes'

export type NotificacaoRow = {
  id: string
  tenant_user_id: string
  usuario_id: string
  titulo: string
  mensagem: string
  tipo: string
  lida: boolean
  link_acao: string | null
  criado_em: string
}

export function mapNotificacaoRow(row: NotificacaoRow): Notificacao {
  return {
    id: row.id,
    usuario_id: row.usuario_id,
    titulo: row.titulo,
    mensagem: row.mensagem,
    tipo: row.tipo as TipoNotificacao,
    lida: row.lida,
    criadoEm: row.criado_em,
    linkAcao: row.link_acao ?? undefined,
  }
}

export async function buscarNotificacoes(usuarioId: string): Promise<Notificacao[]> {
  const { data, error } = await supabase
    .from('notificacoes')
    .select(
      'id, tenant_user_id, usuario_id, titulo, mensagem, tipo, lida, link_acao, criado_em',
    )
    .eq('usuario_id', usuarioId)
    .order('criado_em', { ascending: false })
    .limit(100)

  if (error) throw new Error(error.message)
  return ((data ?? []) as NotificacaoRow[]).map(mapNotificacaoRow)
}

export async function marcarComoLida(notificacaoId: string): Promise<void> {
  const { error } = await supabase
    .from('notificacoes')
    .update({ lida: true })
    .eq('id', notificacaoId)

  if (error) throw new Error(error.message)
}

export async function marcarTodasComoLidas(usuarioId: string): Promise<void> {
  const { error } = await supabase
    .from('notificacoes')
    .update({ lida: true })
    .eq('usuario_id', usuarioId)
    .eq('lida', false)

  if (error) throw new Error(error.message)
}

export async function buscarAuthUserIdProfissional(
  profissionalId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('profissionais')
    .select('auth_user_id')
    .eq('id', profissionalId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data?.auth_user_id ?? null
}

export async function inserirNotificacao(params: {
  tenantUserId: string
  usuarioId: string
  titulo: string
  mensagem: string
  tipo: TipoNotificacao
  linkAcao?: string
}): Promise<Notificacao> {
  const { data, error } = await supabase
    .from('notificacoes')
    .insert({
      tenant_user_id: params.tenantUserId,
      usuario_id: params.usuarioId,
      titulo: params.titulo,
      mensagem: params.mensagem,
      tipo: params.tipo,
      link_acao: params.linkAcao ?? null,
    })
    .select(
      'id, tenant_user_id, usuario_id, titulo, mensagem, tipo, lida, link_acao, criado_em',
    )
    .single()

  if (error) throw new Error(error.message)
  return mapNotificacaoRow(data as NotificacaoRow)
}
