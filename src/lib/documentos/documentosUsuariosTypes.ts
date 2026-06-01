export type TipoDocumentoProfissional = 'contrato' | 'crm' | 'coren'

export type StatusDocumentoProfissional = 'pendente' | 'validado' | 'rejeitado'

export type DocumentoUsuarioRow = {
  id: string
  user_id: string
  profissional_id: string
  tipo: TipoDocumentoProfissional
  nome_arquivo: string
  storage_path: string
  mime_type: string
  status: StatusDocumentoProfissional
  motivo_rejeicao: string | null
  uploaded_by: string | null
  created_at: string
  updated_at: string
}

export const ROTULOS_TIPO_DOCUMENTO: Record<TipoDocumentoProfissional, string> = {
  contrato: 'Contrato',
  crm: 'CRM',
  coren: 'COREN',
}

export const ROTULOS_STATUS_DOCUMENTO: Record<StatusDocumentoProfissional, string> = {
  pendente: 'Pendente',
  validado: 'Validado',
  rejeitado: 'Rejeitado',
}

export const MENSAGEM_BLOQUEIO_DOCUMENTOS_CONSELHO =
  'Atenção: Este profissional possui pendências documentais e não pode assumir plantões até à validação do conselho.'
