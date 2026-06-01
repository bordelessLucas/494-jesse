import {
  MENSAGEM_BLOQUEIO_DOCUMENTOS_CONSELHO,
  type DocumentoUsuarioRow,
  type TipoDocumentoProfissional,
} from './documentosUsuariosTypes'

export { MENSAGEM_BLOQUEIO_DOCUMENTOS_CONSELHO }

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
