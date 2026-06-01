import { buscarTenantUserIdParaBranding } from '../auth/contaMembroDb'
import { supabase } from '../supabase'
import type {
  DocumentoUsuarioRow,
  StatusDocumentoProfissional,
  TipoDocumentoProfissional,
} from './documentosUsuariosTypes'
import { montarMapaConselhoValidado } from './validacaoDocumentos'

export async function buscarProfissionaisComSiglaConselho(
  tenantUserId: string,
): Promise<{ id: string; sigla_conselho: string }[]> {
  const { data, error } = await supabase
    .from('profissionais')
    .select('id, sigla_conselho')
    .eq('user_id', tenantUserId)

  if (error) throw new Error(error.message)
  return (data ?? []) as { id: string; sigla_conselho: string }[]
}

const COLUNAS =
  'id, user_id, profissional_id, tipo, nome_arquivo, storage_path, mime_type, status, motivo_rejeicao, uploaded_by, created_at, updated_at'

export async function listarDocumentosProfissional(
  profissionalId: string,
): Promise<DocumentoUsuarioRow[]> {
  const { data, error } = await supabase
    .from('documentos_usuarios')
    .select(COLUNAS)
    .eq('profissional_id', profissionalId)
    .order('created_at', { ascending: false })

  if (error) {
    if (error.message.includes('documentos_usuarios') || error.message.includes('schema')) {
      return []
    }
    throw new Error(error.message)
  }

  return (data ?? []) as DocumentoUsuarioRow[]
}

export async function listarDocumentosProfissionais(
  profissionalIds: string[],
): Promise<DocumentoUsuarioRow[]> {
  if (profissionalIds.length === 0) return []

  const { data, error } = await supabase
    .from('documentos_usuarios')
    .select(COLUNAS)
    .in('profissional_id', profissionalIds)

  if (error) {
    if (error.message.includes('documentos_usuarios') || error.message.includes('schema')) {
      return []
    }
    throw new Error(error.message)
  }

  return (data ?? []) as DocumentoUsuarioRow[]
}

export async function registrarDocumentoProfissional(params: {
  profissionalId: string
  tipo: TipoDocumentoProfissional
  nomeArquivo: string
  storagePath: string
}): Promise<DocumentoUsuarioRow> {
  const {
    data: { user },
    error: sessionError,
  } = await supabase.auth.getUser()
  if (sessionError || !user) {
    throw new Error('Sessão inválida.')
  }

  const tenantUserId = await buscarTenantUserIdParaBranding(user.id)

  const { data, error } = await supabase
    .from('documentos_usuarios')
    .insert({
      user_id: tenantUserId,
      profissional_id: params.profissionalId,
      tipo: params.tipo,
      nome_arquivo: params.nomeArquivo,
      storage_path: params.storagePath,
      mime_type: 'application/pdf',
      status: 'pendente',
      uploaded_by: user.id,
    })
    .select(COLUNAS)
    .single()

  if (error) throw new Error(error.message)
  return data as DocumentoUsuarioRow
}

export async function atualizarStatusDocumento(params: {
  documentoId: string
  status: StatusDocumentoProfissional
  motivoRejeicao?: string | null
}): Promise<void> {
  const { error } = await supabase
    .from('documentos_usuarios')
    .update({
      status: params.status,
      motivo_rejeicao:
        params.status === 'rejeitado' ? (params.motivoRejeicao?.trim() || null) : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.documentoId)

  if (error) throw new Error(error.message)
}

export async function excluirDocumentoProfissional(documentoId: string): Promise<void> {
  const { data: doc, error: fetchError } = await supabase
    .from('documentos_usuarios')
    .select('storage_path')
    .eq('id', documentoId)
    .maybeSingle()

  if (fetchError) throw new Error(fetchError.message)
  if (!doc) return

  const { error: storageError } = await supabase.storage
    .from('documentos_profissionais')
    .remove([doc.storage_path])

  if (storageError) {
    console.warn('Falha ao remover ficheiro do storage:', storageError.message)
  }

  const { error } = await supabase.from('documentos_usuarios').delete().eq('id', documentoId)
  if (error) throw new Error(error.message)
}

export async function carregarMapaConselhoValidado(
  tenantUserId: string,
): Promise<Map<string, boolean>> {
  const profissionais = await buscarProfissionaisComSiglaConselho(tenantUserId)
  const documentos = await listarDocumentosProfissionais(profissionais.map((p) => p.id))
  return montarMapaConselhoValidado(profissionais, documentos)
}
