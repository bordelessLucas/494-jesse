import { buscarTenantUserIdParaBranding } from '../auth/contaMembroDb'
import { supabase } from '../supabase'
import type { TipoDocumentoProfissional } from './documentosUsuariosTypes'

export const BUCKET_DOCUMENTOS_PROFISSIONAIS = 'documentos_profissionais'

export const TAMANHO_MAX_PDF_BYTES = 10 * 1024 * 1024 // 10 MB

function mensagemErroStorage(mensagem: string): string {
  const m = mensagem.toLowerCase()
  if (m.includes('row-level security') || m.includes('rls') || m.includes('policy')) {
    return 'Não tem permissão para enviar ficheiros. Verifique o seu acesso.'
  }
  if (m.includes('payload too large') || m.includes('413')) {
    return 'O ficheiro excede o tamanho máximo permitido (10 MB).'
  }
  return mensagem || 'Falha ao enviar o documento.'
}

function sanitizarNomeArquivo(nome: string): string {
  const base = nome.replace(/[^\w.\-() ]+/g, '_').trim() || 'documento.pdf'
  return base.toLowerCase().endsWith('.pdf') ? base : `${base}.pdf`
}

/**
 * Envia um PDF para o bucket `documentos_profissionais`.
 * Caminho: `{tenantUserId}/{profissionalId}/{timestamp}-{uuid}-{nome}.pdf`
 */
export async function uploadDocumentoProfissionalPdf(params: {
  profissionalId: string
  file: File
}): Promise<{ storagePath: string }> {
  const { profissionalId, file } = params

  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    throw new Error('Envie apenas ficheiros PDF.')
  }
  if (file.size > TAMANHO_MAX_PDF_BYTES) {
    throw new Error('O PDF deve ter no máximo 10 MB.')
  }

  const {
    data: { user },
    error: sessionError,
  } = await supabase.auth.getUser()
  if (sessionError || !user) {
    throw new Error('Sessão inválida. Inicie sessão novamente.')
  }

  const tenantUserId = await buscarTenantUserIdParaBranding(user.id)
  const nomeSeguro = sanitizarNomeArquivo(file.name)
  const storagePath = `${tenantUserId}/${profissionalId}/${Date.now()}-${crypto.randomUUID()}-${nomeSeguro}`

  const { error } = await supabase.storage
    .from(BUCKET_DOCUMENTOS_PROFISSIONAIS)
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: 'application/pdf',
    })

  if (error) {
    throw new Error(mensagemErroStorage(error.message))
  }

  return { storagePath }
}

export async function obterUrlAssinadaDocumento(
  storagePath: string,
  expiresInSeconds = 3600,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET_DOCUMENTOS_PROFISSIONAIS)
    .createSignedUrl(storagePath, expiresInSeconds)

  if (error || !data?.signedUrl) {
    throw new Error(error?.message ?? 'Não foi possível abrir o documento.')
  }

  return data.signedUrl
}

export type { TipoDocumentoProfissional }
