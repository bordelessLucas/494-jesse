import type { StatusWorkflowRelatorio } from '../../../lib/relatorios/relatoriosHistoricoDb'

export const FASES_WORKFLOW_RELATORIO: {
  status: StatusWorkflowRelatorio
  label: string
  descricao: string
}[] = [
  { status: 'rascunho', label: 'Rascunho', descricao: 'Em elaboração pelo coordenador' },
  { status: 'em_auditoria', label: 'Em Auditoria', descricao: 'Aguarda revisão do auditor' },
  { status: 'aprovado', label: 'Aprovado', descricao: 'Validado e pronto para faturação' },
  { status: 'faturado', label: 'Faturado', descricao: 'Processo concluído' },
]

export const ROTULOS_STATUS_WORKFLOW: Record<StatusWorkflowRelatorio, string> = {
  rascunho: 'Rascunho',
  em_auditoria: 'Em Auditoria',
  aprovado: 'Aprovado',
  faturado: 'Faturado',
}

export function indiceFaseWorkflow(status: StatusWorkflowRelatorio): number {
  return FASES_WORKFLOW_RELATORIO.findIndex((f) => f.status === status)
}

export function statusWorkflowSeguro(
  status: StatusWorkflowRelatorio | null | undefined,
): StatusWorkflowRelatorio {
  if (
    status === 'rascunho' ||
    status === 'em_auditoria' ||
    status === 'aprovado' ||
    status === 'faturado'
  ) {
    return status
  }
  return 'rascunho'
}
