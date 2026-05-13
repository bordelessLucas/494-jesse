import { supabase } from './supabase'

const BUCKET_RELATORIOS_IMAGENS = 'relatorios-imagens'

/** Limite recomendado para uploads no editor (alinhado à política do bucket). */
export const TAMANHO_MAX_IMAGEM_RELATORIO_BYTES = 5 * 1024 * 1024 // 5 MB

const MIME_PARA_EXTENSAO: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
}

const EXTENSOES_PERMITIDAS = /\.(jpe?g|png|gif|webp|svg)$/i

function extensaoSeguraDoNome(nomeFicheiro: string): string {
  if (!nomeFicheiro.includes('.')) return ''
  const candidata = nomeFicheiro.slice(nomeFicheiro.lastIndexOf('.')).toLowerCase()
  return EXTENSOES_PERMITIDAS.test(candidata) ? candidata : ''
}

function extensaoDoMime(mime: string): string {
  return MIME_PARA_EXTENSAO[mime] ?? ''
}

function gerarCaminhoObjetoUnico(file: File): string {
  const base = `${Date.now()}-${crypto.randomUUID()}`
  const daNome = extensaoSeguraDoNome(file.name)
  if (daNome) return `${base}${daNome}`
  const doMime = extensaoDoMime(file.type)
  return doMime ? `${base}${doMime}` : base
}

function mensagemErroStorage(mensagem: string): string {
  const m = mensagem.toLowerCase()
  if (m.includes('network') || m.includes('fetch')) {
    return 'Erro de rede. Verifique a ligação e tente novamente.'
  }
  if (m.includes('payload too large') || m.includes('413')) {
    return 'O servidor recusou o ficheiro por ser demasiado grande.'
  }
  if (m.includes('row-level security') || m.includes('rls') || m.includes('policy')) {
    return 'Não tem permissão para enviar ficheiros. Inicie sessão ou contacte o administrador.'
  }
  return mensagem || 'Falha ao enviar a imagem.'
}

/**
 * Envia uma imagem para o bucket público `relatorios-imagens` e devolve a URL pública.
 * O bucket deve existir no projeto Supabase com acesso de leitura público (ou URL assinada, conforme configuração).
 */
export async function uploadImagemRelatorio(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Seleccione apenas um ficheiro de imagem.')
  }
  if (file.size > TAMANHO_MAX_IMAGEM_RELATORIO_BYTES) {
    throw new Error(
      `Ficheiro demasiado grande. O máximo é ${Math.round(TAMANHO_MAX_IMAGEM_RELATORIO_BYTES / (1024 * 1024))} MB.`,
    )
  }

  const caminho = gerarCaminhoObjetoUnico(file)

  const { data, error } = await supabase.storage
    .from(BUCKET_RELATORIOS_IMAGENS)
    .upload(caminho, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || undefined,
    })

  if (error) {
    throw new Error(mensagemErroStorage(error.message))
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET_RELATORIOS_IMAGENS)
    .getPublicUrl(data.path)

  return urlData.publicUrl
}
