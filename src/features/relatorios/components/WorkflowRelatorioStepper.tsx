import { Check } from 'lucide-react'

import { cn } from '../../../lib/cn'
import type { StatusWorkflowRelatorio } from '../../../lib/relatorios/relatoriosHistoricoDb'
import {
  FASES_WORKFLOW_RELATORIO,
  indiceFaseWorkflow,
  statusWorkflowSeguro,
} from '../workflow/relatorioWorkflowTypes'

type WorkflowRelatorioStepperProps = {
  status: StatusWorkflowRelatorio | null | undefined
}

export function WorkflowRelatorioStepper({ status }: WorkflowRelatorioStepperProps) {
  const statusAtual = statusWorkflowSeguro(status)
  const indiceAtual = indiceFaseWorkflow(statusAtual)

  return (
    <nav aria-label="Progresso do workflow do relatório" className="w-full">
      <ol className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {FASES_WORKFLOW_RELATORIO.map((fase, indice) => {
          const concluida = indice < indiceAtual
          const actual = indice === indiceAtual
          const futura = indice > indiceAtual

          return (
            <li key={fase.status} className="flex min-w-0 flex-1 items-start gap-3 sm:flex-col sm:items-center">
              <div className="flex shrink-0 flex-col items-center sm:w-full">
                <div className="flex w-full items-center sm:justify-center">
                  {indice > 0 ? (
                    <span
                      className={cn(
                        'hidden h-0.5 flex-1 sm:block',
                        concluida ? 'bg-success-500' : 'bg-slate-200',
                      )}
                      aria-hidden
                    />
                  ) : null}
                  <span
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors',
                      actual && 'border-primary-600 bg-primary-600 text-white',
                      concluida && 'border-success-600 bg-success-600 text-white',
                      futura && 'border-slate-300 bg-white text-slate-400',
                    )}
                  >
                    {concluida ? (
                      <Check className="h-4 w-4" aria-hidden />
                    ) : (
                      <span>{indice + 1}</span>
                    )}
                  </span>
                  {indice < FASES_WORKFLOW_RELATORIO.length - 1 ? (
                    <span
                      className={cn(
                        'hidden h-0.5 flex-1 sm:block',
                        indice < indiceAtual ? 'bg-success-500' : 'bg-slate-200',
                      )}
                      aria-hidden
                    />
                  ) : null}
                </div>
              </div>
              <div className="min-w-0 flex-1 sm:text-center">
                <p
                  className={cn(
                    'text-sm font-semibold',
                    actual && 'text-primary-700',
                    concluida && 'text-success-700',
                    futura && 'text-slate-400',
                  )}
                >
                  {fase.label}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">{fase.descricao}</p>
              </div>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
