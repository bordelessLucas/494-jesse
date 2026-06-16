export type CertificadoDigitalRow = {
  id: string
  certificado_url: string
  valido_ate: string
  titular_certificado: string | null
  criado_em: string
}

export const EXTENSOES_CERTIFICADO = ['.pfx', '.p12'] as const

export const TAMANHO_MAX_CERTIFICADO_BYTES = 5 * 1024 * 1024 // 5 MB

export const BUCKET_CERTIFICADOS_SEGUROS = 'certificados_seguros'
