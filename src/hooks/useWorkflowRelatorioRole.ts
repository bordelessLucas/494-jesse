import { useMemo } from 'react'

import type { ContaMembroRow } from '../lib/auth/contaMembroDb'
import { useContaMembro } from './useContaMembro'

export type WorkflowRelatorioRole = {
  isCoordenador: boolean
  isAuditor: boolean
  isFaturista: boolean
  membroRole: ContaMembroRow['role'] | null
}

export function resolverPapelWorkflowRelatorio(params: {
  isTitular: boolean
  membro: ContaMembroRow | null
}): WorkflowRelatorioRole {
  const membroRole = params.membro?.role ?? null

  if (params.isTitular) {
    return {
      isCoordenador: true,
      isAuditor: false,
      isFaturista: false,
      membroRole: null,
    }
  }

  return {
    isCoordenador: membroRole !== 'auditor' && membroRole !== 'faturista' && membroRole !== null,
    isAuditor: membroRole === 'auditor',
    isFaturista: membroRole === 'faturista',
    membroRole,
  }
}

export function useWorkflowRelatorioRole(): WorkflowRelatorioRole & { isLoading: boolean } {
  const { isLoading, isTitular, membro } = useContaMembro()

  const papel = useMemo(
    () => resolverPapelWorkflowRelatorio({ isTitular, membro }),
    [isTitular, membro],
  )

  return { ...papel, isLoading }
}
