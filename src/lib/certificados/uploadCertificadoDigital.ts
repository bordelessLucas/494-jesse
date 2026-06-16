import { buscarTenantUserIdParaBranding } from '../auth/contaMembroDb'
import { supabase } from '../supabase'
import {
  BUCKET_CERTIFICADOS_SEGUROS,
  EXTENSOES_CERTIFICADO,
  TAMANHO_MAX_CERTIFICADO_BYTES,
} from './certificadosDigitaisTypes'

function mensagemErroStorage(mensagem: string): string {
  const m = mensagem.toLowerCase()
  if (m.includes('row-level security') || m.includes('rls') || m.includes('policy')) {
    return 'Não tem permissão para enviar certificados. Verifique o seu acesso.'
  }
  if (m.includes('payload too large') || m.includes('413')) {
    return 'O ficheiro excede o tamanho máximo permitido (5 MB).'
  }
  return mensagem || 'Falha ao enviar o certificado.'
}

function extensaoPermitida(nome: string): boolean {
  const lower = nome.toLowerCase()
  return EXTENSOES_CERTIFICADO.some((ext) => lower.endsWith(ext))
}

function sanitizarNomeArquivo(nome: string): string {
  const base = nome.replace(/[^\w.\-() ]+/g, '_').trim() || 'certificado.pfx'
  if (extensaoPermitida(base)) return base
  return `${base}.pfx`
}

/**
 * Envia um certificado digital para o bucket privado `certificados_seguros`.
 * Caminho: `{tenantUserId}/{profissionalId}/{timestamp}-{uuid}-{nome}.pfx`
 */
export async function uploadCertificadoDigital(params: {
  profissionalId: string
  file: File
}): Promise<{ storagePath: string }> {
  const { profissionalId, file } = params

  if (!extensaoPermitida(file.name)) {
    throw new Error('Envie apenas ficheiros .pfx ou .p12.')
  }
  if (file.size > TAMANHO_MAX_CERTIFICADO_BYTES) {
    throw new Error('O certificado deve ter no máximo 5 MB.')
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
    .from(BUCKET_CERTIFICADOS_SEGUROS)
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: 'application/x-pkcs12',
    })

  if (error) {
    throw new Error(mensagemErroStorage(error.message))
  }

  return { storagePath }
}

export async function removerCertificadoStorage(storagePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from(BUCKET_CERTIFICADOS_SEGUROS)
    .remove([storagePath])

  if (error) {
    console.warn('Falha ao remover certificado antigo do storage:', error.message)
  }
}
