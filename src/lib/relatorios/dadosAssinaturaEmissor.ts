import { supabase } from '../supabase'
import type { AssinaturaResponsavel } from '../../features/relatorios/types'
import type { CabecalhoContratualData } from '../../features/relatorios/types'
import { formatarDataSegura } from '../datas/formatacaoSegura'

export type DadosAssinaturaEmissor = {
  profissionalId: string
  nome: string
  crmRqe: string
  titularCertificado: string | null
  certificadoValidoAte: string | null
}

export async function buscarDadosAssinaturaEmissor(
  profissionalId: string,
): Promise<DadosAssinaturaEmissor | null> {
  const { data: profissional, error: profError } = await supabase
    .from('profissionais')
    .select('id, nome, sigla_conselho, conselho_numero, registro_uf')
    .eq('id', profissionalId)
    .maybeSingle()

  if (profError || !profissional) return null

  const { data: certificado } = await supabase
    .from('certificados_profissionais')
    .select('valido_ate, titular_certificado')
    .eq('profissional_id', profissionalId)
    .maybeSingle()

  const uf = profissional.registro_uf?.trim() || ''
  const numero = profissional.conselho_numero?.trim() || ''
  const sigla = profissional.sigla_conselho?.trim() || 'CRM'
  const crmRqe =
    numero && uf ? `${sigla}/${uf} ${numero}` : numero ? `${sigla} ${numero}` : sigla

  return {
    profissionalId: profissional.id,
    nome: profissional.nome,
    crmRqe,
    titularCertificado: certificado?.titular_certificado ?? null,
    certificadoValidoAte: certificado?.valido_ate ?? null,
  }
}

export function montarAssinaturaDocumento(
  cabecalho: CabecalhoContratualData,
  emissor: DadosAssinaturaEmissor | null,
  dataHoraAssinatura?: string,
): AssinaturaResponsavel {
  return {
    nomeProfissional:
      emissor?.nome ?? (cabecalho.coordenador || 'Responsável técnico'),
    crmRqe: emissor?.crmRqe ?? 'CRM —',
    nomeEmpresa: cabecalho.empresa,
    cnpjEmpresa: cabecalho.cnpj,
    titularCertificado: emissor?.titularCertificado ?? undefined,
    certificadoValidoAte: emissor?.certificadoValidoAte
      ? formatarDataSegura(emissor.certificadoValidoAte, 'dd/MM/yyyy')
      : undefined,
    dataHoraAssinatura,
  }
}
