import { supabase } from '../supabase'

const BUCKET_RELATORIOS_ASSINADOS = 'relatorios_assinados'
export const TAMANHO_MAX_ANEXO_PDF_BYTES = 10 * 1024 * 1024

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
 * Envia um PDF de juntada para o bucket `relatorios_assinados`.
 * Caminho: `{tenantUserId}/{relatorioId}/anexos/{timestamp}-{nome}.pdf`
 */
export async function uploadAnexoRelatorioPdf(params: {
  tenantUserId: string
  relatorioId: string
  file: File
}): Promise<string> {
  const { tenantUserId, relatorioId, file } = params

  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    throw new Error('Envie apenas ficheiros PDF.')
  }
  if (file.size > TAMANHO_MAX_ANEXO_PDF_BYTES) {
    throw new Error('O PDF deve ter no máximo 10 MB.')
  }

  const nomeSeguro = sanitizarNomeArquivo(file.name)
  const storagePath = `${tenantUserId}/${relatorioId}/anexos/${Date.now()}-${crypto.randomUUID()}-${nomeSeguro}`

  const { error } = await supabase.storage
    .from(BUCKET_RELATORIOS_ASSINADOS)
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: 'application/pdf',
    })

  if (error) {
    throw new Error(mensagemErroStorage(error.message))
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET_RELATORIOS_ASSINADOS)
    .getPublicUrl(storagePath)

  return urlData.publicUrl
}
