export type StatusConfirmacaoEscala = 'pendente' | 'confirmado' | 'recusado'

export type EstadoConfirmacaoPlantao =
  | 'aguardando'
  | 'confirmado'
  | 'recusado'
  | 'sem_profissional'

export function resolverEstadoConfirmacao(params: {
  profissionalId: string | null | undefined
  confirmadoProfissional?: boolean
  confirmacaoStatus?: StatusConfirmacaoEscala | null
  motivoRecusa?: string | null
}): EstadoConfirmacaoPlantao {
  if (params.confirmacaoStatus === 'recusado' || params.motivoRecusa) {
    return 'recusado'
  }
  if (!params.profissionalId) {
    return 'sem_profissional'
  }
  if (params.confirmadoProfissional || params.confirmacaoStatus === 'confirmado') {
    return 'confirmado'
  }
  return 'aguardando'
}
