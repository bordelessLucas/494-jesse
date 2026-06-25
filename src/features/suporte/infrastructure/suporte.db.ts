import { supabase } from '../../../lib/supabase'
import type {
  AutorTipoSuporte,
  StatusConversaSuporte,
  SuporteArtigo,
  SuporteConversa,
  SuporteConversaResumo,
  SuporteFluxo,
  SuporteFluxoComOpcoes,
  SuporteFluxoOpcao,
  SuporteMensagem,
} from '../domain/suporte.types'

type ConversaRow = {
  id: string
  tenant_user_id: string
  usuario_id: string
  status: StatusConversaSuporte
  fluxo_atual_id: string | null
  criada_em: string
  atualizada_em: string
}

type MensagemRow = {
  id: string
  conversa_id: string
  autor_tipo: AutorTipoSuporte
  autor_id: string | null
  texto: string
  fluxo_opcao_id: string | null
  criada_em: string
}

type FluxoRow = {
  id: string
  titulo: string
  mensagem: string
  tipo: SuporteFluxo['tipo']
  slug: string | null
}

type OpcaoRow = {
  id: string
  fluxo_id: string
  label: string
  proximo_fluxo_id: string | null
  ordem: number
}

type ArtigoRow = {
  id: string
  tenant_user_id: string | null
  titulo: string
  palavras_chave: string[]
  conteudo: string
  ativo: boolean
}

export function mapConversa(row: ConversaRow): SuporteConversa {
  return {
    id: row.id,
    tenantUserId: row.tenant_user_id,
    usuarioId: row.usuario_id,
    status: row.status,
    fluxoAtualId: row.fluxo_atual_id,
    criadaEm: row.criada_em,
    atualizadaEm: row.atualizada_em,
  }
}

export function mapMensagem(row: MensagemRow): SuporteMensagem {
  return {
    id: row.id,
    conversaId: row.conversa_id,
    autorTipo: row.autor_tipo,
    autorId: row.autor_id,
    texto: row.texto,
    fluxoOpcaoId: row.fluxo_opcao_id,
    criadaEm: row.criada_em,
  }
}

function mapFluxo(row: FluxoRow): SuporteFluxo {
  return {
    id: row.id,
    titulo: row.titulo,
    mensagem: row.mensagem,
    tipo: row.tipo,
    slug: row.slug,
  }
}

function mapOpcao(row: OpcaoRow): SuporteFluxoOpcao {
  return {
    id: row.id,
    fluxoId: row.fluxo_id,
    label: row.label,
    proximoFluxoId: row.proximo_fluxo_id,
    ordem: row.ordem,
  }
}

function mapArtigo(row: ArtigoRow): SuporteArtigo {
  return {
    id: row.id,
    tenantUserId: row.tenant_user_id,
    titulo: row.titulo,
    palavrasChave: row.palavras_chave ?? [],
    conteudo: row.conteudo,
    ativo: row.ativo,
  }
}

const CONVERSA_COLS =
  'id, tenant_user_id, usuario_id, status, fluxo_atual_id, criada_em, atualizada_em'

const MENSAGEM_COLS =
  'id, conversa_id, autor_tipo, autor_id, texto, fluxo_opcao_id, criada_em'

export async function buscarConversaAtiva(usuarioId: string): Promise<SuporteConversa | null> {
  const { data, error } = await supabase
    .from('suporte_conversas')
    .select(CONVERSA_COLS)
    .eq('usuario_id', usuarioId)
    .neq('status', 'resolvida')
    .order('atualizada_em', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data ? mapConversa(data as ConversaRow) : null
}

export async function buscarConversasHistorico(
  usuarioId: string,
  limite = 20,
): Promise<SuporteConversa[]> {
  const { data, error } = await supabase
    .from('suporte_conversas')
    .select(CONVERSA_COLS)
    .eq('usuario_id', usuarioId)
    .order('atualizada_em', { ascending: false })
    .limit(limite)

  if (error) throw new Error(error.message)
  return ((data ?? []) as ConversaRow[]).map(mapConversa)
}

export async function buscarConversasInbox(
  tenantUserId: string,
  statusFiltro?: StatusConversaSuporte | 'todas',
): Promise<SuporteConversaResumo[]> {
  let query = supabase
    .from('suporte_conversas')
    .select(CONVERSA_COLS)
    .eq('tenant_user_id', tenantUserId)
    .order('atualizada_em', { ascending: false })
    .limit(100)

  if (statusFiltro && statusFiltro !== 'todas') {
    query = query.eq('status', statusFiltro)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  const conversas = ((data ?? []) as ConversaRow[]).map(mapConversa)
  if (conversas.length === 0) return []

  const ids = conversas.map((c) => c.id)
  const { data: msgs, error: msgErr } = await supabase
    .from('suporte_mensagens')
    .select('conversa_id, texto, criada_em')
    .in('conversa_id', ids)
    .order('criada_em', { ascending: false })

  if (msgErr) throw new Error(msgErr.message)

  const ultimaPorConversa = new Map<string, string>()
  for (const m of msgs ?? []) {
    const row = m as { conversa_id: string; texto: string }
    if (!ultimaPorConversa.has(row.conversa_id)) {
      ultimaPorConversa.set(row.conversa_id, row.texto)
    }
  }

  return conversas.map((c) => ({
    ...c,
    ultimaMensagem: ultimaPorConversa.get(c.id),
  }))
}

export async function criarConversa(params: {
  tenantUserId: string
  usuarioId: string
  fluxoRaizId: string
}): Promise<SuporteConversa> {
  const { data, error } = await supabase
    .from('suporte_conversas')
    .insert({
      tenant_user_id: params.tenantUserId,
      usuario_id: params.usuarioId,
      status: 'aguardando_usuario',
      fluxo_atual_id: params.fluxoRaizId,
    })
    .select(CONVERSA_COLS)
    .single()

  if (error) throw new Error(error.message)
  return mapConversa(data as ConversaRow)
}

export async function atualizarConversa(
  conversaId: string,
  patch: Partial<{
    status: StatusConversaSuporte
    fluxoAtualId: string | null
  }>,
): Promise<SuporteConversa> {
  const payload: {
    status?: StatusConversaSuporte
    fluxo_atual_id?: string | null
  } = {}
  if (patch.status !== undefined) payload.status = patch.status
  if (patch.fluxoAtualId !== undefined) payload.fluxo_atual_id = patch.fluxoAtualId

  const { data, error } = await supabase
    .from('suporte_conversas')
    .update(payload)
    .eq('id', conversaId)
    .select(CONVERSA_COLS)
    .single()

  if (error) throw new Error(error.message)
  return mapConversa(data as ConversaRow)
}

export async function buscarMensagensConversa(
  conversaId: string,
): Promise<SuporteMensagem[]> {
  const { data, error } = await supabase
    .from('suporte_mensagens')
    .select(MENSAGEM_COLS)
    .eq('conversa_id', conversaId)
    .order('criada_em', { ascending: true })

  if (error) throw new Error(error.message)
  return ((data ?? []) as MensagemRow[]).map(mapMensagem)
}

export async function inserirMensagem(params: {
  conversaId: string
  autorTipo: AutorTipoSuporte
  autorId?: string | null
  texto: string
  fluxoOpcaoId?: string | null
}): Promise<SuporteMensagem> {
  const { data, error } = await supabase
    .from('suporte_mensagens')
    .insert({
      conversa_id: params.conversaId,
      autor_tipo: params.autorTipo,
      autor_id: params.autorId ?? null,
      texto: params.texto,
      fluxo_opcao_id: params.fluxoOpcaoId ?? null,
    })
    .select(MENSAGEM_COLS)
    .single()

  if (error) throw new Error(error.message)
  return mapMensagem(data as MensagemRow)
}

export async function buscarFluxoPorSlug(slug: string): Promise<SuporteFluxo | null> {
  const { data, error } = await supabase
    .from('suporte_fluxos')
    .select('id, titulo, mensagem, tipo, slug')
    .eq('slug', slug)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data ? mapFluxo(data as FluxoRow) : null
}

export async function buscarFluxoPorId(fluxoId: string): Promise<SuporteFluxo | null> {
  const { data, error } = await supabase
    .from('suporte_fluxos')
    .select('id, titulo, mensagem, tipo, slug')
    .eq('id', fluxoId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data ? mapFluxo(data as FluxoRow) : null
}

export async function buscarFluxoComOpcoes(
  fluxoId: string,
): Promise<SuporteFluxoComOpcoes | null> {
  const fluxo = await buscarFluxoPorId(fluxoId)
  if (!fluxo) return null

  const { data, error } = await supabase
    .from('suporte_fluxo_opcoes')
    .select('id, fluxo_id, label, proximo_fluxo_id, ordem')
    .eq('fluxo_id', fluxoId)
    .order('ordem', { ascending: true })

  if (error) throw new Error(error.message)

  return {
    ...fluxo,
    opcoes: ((data ?? []) as OpcaoRow[]).map(mapOpcao),
  }
}

export async function buscarOpcaoFluxo(
  opcaoId: string,
): Promise<SuporteFluxoOpcao | null> {
  const { data, error } = await supabase
    .from('suporte_fluxo_opcoes')
    .select('id, fluxo_id, label, proximo_fluxo_id, ordem')
    .eq('id', opcaoId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data ? mapOpcao(data as OpcaoRow) : null
}

export async function buscarArtigosAtivos(): Promise<SuporteArtigo[]> {
  const { data, error } = await supabase
    .from('suporte_artigos')
    .select('id, tenant_user_id, titulo, palavras_chave, conteudo, ativo')
    .eq('ativo', true)

  if (error) throw new Error(error.message)
  return ((data ?? []) as ArtigoRow[]).map(mapArtigo)
}

export async function buscarConversaPorId(
  conversaId: string,
): Promise<SuporteConversa | null> {
  const { data, error } = await supabase
    .from('suporte_conversas')
    .select(CONVERSA_COLS)
    .eq('id', conversaId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data ? mapConversa(data as ConversaRow) : null
}
