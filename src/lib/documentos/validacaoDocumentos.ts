import {
  MENSAGEM_BLOQUEIO_DOCUMENTOS_CONSELHO,
  type DocumentoUsuarioRow,
  type TipoDocumentoProfissional,
} from './documentosUsuariosTypes'

export { MENSAGEM_BLOQUEIO_DOCUMENTOS_CONSELHO }

/**
 * Quando `false`, profissionais sem CRM/COREN validado podem ser alocados em plantões.
 * Reativar em produção após testes.
 */
export const EXIGIR_CONSELHO_VALIDADO_PARA_PLANTAO = false

export function profissionalPodeSerAlocadoEmPlantao(
  profissionalId: string | null | undefined,
  conselhoValidadoPorProf: Map<string, boolean>,
): boolean {
  if (!profissionalId) return true
  if (!EXIGIR_CONSELHO_VALIDADO_PARA_PLANTAO) return true
  return conselhoValidadoPorProf.get(profissionalId) === true
}

/** Determina se o profissional exige documento CRM ou COREN conforme a sigla do conselho. */
export function tipoConselhoDocumentoObrigatorio(
  siglaConselho: string | null | undefined,
): TipoDocumentoProfissional {
  const sigla = (siglaConselho ?? '').toUpperCase()
  if (sigla.includes('COREN')) return 'coren'
  return 'crm'
}

export function profissionalPossuiConselhoValidado(
  documentos: DocumentoUsuarioRow[],
  siglaConselho: string | null | undefined,
): boolean {
  const tipoObrigatorio = tipoConselhoDocumentoObrigatorio(siglaConselho)
  return documentos.some(
    (doc) => doc.tipo === tipoObrigatorio && doc.status === 'validado',
  )
}

export function montarMapaConselhoValidado(
  profissionais: { id: string; sigla_conselho: string }[],
  documentos: DocumentoUsuarioRow[],
): Map<string, boolean> {
  const porProf = new Map<string, DocumentoUsuarioRow[]>()
  for (const doc of documentos) {
    const lista = porProf.get(doc.profissional_id) ?? []
    lista.push(doc)
    porProf.set(doc.profissional_id, lista)
  }

  const mapa = new Map<string, boolean>()
  for (const prof of profissionais) {
    mapa.set(
      prof.id,
      profissionalPossuiConselhoValidado(
        porProf.get(prof.id) ?? [],
        prof.sigla_conselho,
      ),
    )
  }
  return mapa
}
