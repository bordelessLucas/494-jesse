import { supabase } from '../supabase'
import type { CertificadoDigitalRow } from './certificadosDigitaisTypes'

const COLUNAS_RESUMO = 'id, certificado_url, valido_ate, titular_certificado, criado_em'

export async function buscarCertificadoProfissional(
  profissionalId: string,
): Promise<CertificadoDigitalRow | null> {
  const { data, error } = await supabase
    .from('certificados_profissionais')
    .select(COLUNAS_RESUMO)
    .eq('profissional_id', profissionalId)
    .maybeSingle()

  if (error) {
    if (
      error.message.includes('certificados_profissionais') ||
      error.message.includes('schema')
    ) {
      throw new Error(
        'Módulo de certificados digitais indisponível. Aplique a migração no Supabase.',
      )
    }
    throw new Error(error.message)
  }

  return data as CertificadoDigitalRow | null
}

export async function salvarCertificadoProfissional(params: {
  certificadoUrl: string
  senhaPlana: string
  validoAte: Date
  titularCertificado?: string
}): Promise<string> {
  const { certificadoUrl, senhaPlana, validoAte, titularCertificado } = params

  const { data, error } = await supabase.rpc('upsert_certificado_profissional', {
    p_certificado_url: certificadoUrl,
    p_senha_plana: senhaPlana,
    p_valido_ate: validoAte.toISOString(),
    p_titular_certificado: titularCertificado?.trim() || null,
  })

  if (error) {
    throw new Error(error.message || 'Não foi possível guardar o certificado.')
  }

  return data as string
}
