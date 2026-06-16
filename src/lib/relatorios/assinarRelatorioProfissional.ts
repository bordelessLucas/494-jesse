import { supabase } from '../supabase'
import type { RegistrarRelatorioImpressoInput } from './relatoriosHistoricoDb'

export type AssinarRelatorioInput = {
  relatorioId?: string
  profissionalId: string
  pdfBase64: string
  relatorioMeta?: RegistrarRelatorioImpressoInput
}

export type AssinarRelatorioResult = {
  relatorioId: string
  pdfAssinadoUrl: string
  storagePath: string
  assinadoEm: string
  profissionalEmissor: string
}

export async function assinarRelatorioProfissional(
  input: AssinarRelatorioInput,
): Promise<AssinarRelatorioResult> {
  const { data, error } = await supabase.functions.invoke('sign-professional-document', {
    body: {
      relatorioId: input.relatorioId,
      profissionalId: input.profissionalId,
      pdfBase64: input.pdfBase64,
      relatorioMeta: input.relatorioMeta
        ? {
            tipo_relatorio: input.relatorioMeta.tipo_relatorio,
            titulo: input.relatorioMeta.titulo,
            competencia: input.relatorioMeta.competencia,
            local_ref: input.relatorioMeta.local_ref,
            local_nome: input.relatorioMeta.local_nome,
            cabecalho: input.relatorioMeta.cabecalho as Record<string, unknown>,
            snapshot: input.relatorioMeta.snapshot as Record<string, unknown>,
          }
        : undefined,
    },
  })

  if (error) {
    throw new Error(error.message || 'Não foi possível assinar o relatório.')
  }

  const payload = data as { error?: string } & Partial<AssinarRelatorioResult>
  if (payload?.error) {
    throw new Error(payload.error)
  }

  if (!payload?.relatorioId || !payload?.pdfAssinadoUrl) {
    throw new Error('Resposta inválida ao assinar o relatório.')
  }

  return {
    relatorioId: payload.relatorioId,
    pdfAssinadoUrl: payload.pdfAssinadoUrl,
    storagePath: payload.storagePath ?? '',
    assinadoEm: payload.assinadoEm ?? new Date().toISOString(),
    profissionalEmissor: payload.profissionalEmissor ?? '',
  }
}

export type ProfissionalCertificadoAtivo = {
  profissionalId: string
  nome: string
  validoAte: string
}

export async function listarProfissionaisComCertificadoAtivo(
  tenantUserId: string,
): Promise<ProfissionalCertificadoAtivo[]> {
  const { data, error } = await supabase
    .from('certificados_profissionais')
    .select('profissional_id, valido_ate, profissionais(nome)')
    .eq('tenant_user_id', tenantUserId)
    .gt('valido_ate', new Date().toISOString())

  if (error) {
    if (
      error.message.includes('certificados_profissionais') ||
      error.message.includes('schema')
    ) {
      return []
    }
    throw new Error(error.message)
  }

  return (data ?? [])
    .map((row) => {
      const prof = row.profissionais as { nome: string } | null
      if (!prof?.nome) return null
      return {
        profissionalId: row.profissional_id,
        nome: prof.nome,
        validoAte: row.valido_ate,
      }
    })
    .filter((item): item is ProfissionalCertificadoAtivo => item !== null)
}
