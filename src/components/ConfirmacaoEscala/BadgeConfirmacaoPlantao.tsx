import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { cn } from '../../lib/cn'
import {
  resolverEstadoConfirmacao,
  type StatusConfirmacaoEscala,
} from '../../lib/escalas/confirmacaoEscalaTypes'

type BadgeConfirmacaoPlantaoProps = {
  profissionalId?: string | null
  confirmadoProfissional?: boolean
  dataConfirmacao?: string | null
  confirmacaoStatus?: StatusConfirmacaoEscala | null
  motivoRecusa?: string | null
  onRealocar?: () => void
  className?: string
}

export function BadgeConfirmacaoPlantao({
  profissionalId,
  confirmadoProfissional,
  dataConfirmacao,
  confirmacaoStatus,
  motivoRecusa,
  onRealocar,
  className,
}: BadgeConfirmacaoPlantaoProps) {
  const estado = resolverEstadoConfirmacao({
    profissionalId,
    confirmadoProfissional,
    confirmacaoStatus,
    motivoRecusa,
  })

  if (estado === 'sem_profissional' && confirmacaoStatus !== 'recusado') {
    return null
  }

  if (estado === 'confirmado') {
    const quando = dataConfirmacao
      ? format(new Date(dataConfirmacao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
      : null
    return (
      <div
        className={cn(
          'rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900',
          className,
        )}
      >
        <p className="font-semibold">✅ Confirmado pelo profissional</p>
        {quando ? <p className="mt-0.5 text-emerald-800">{quando}</p> : null}
      </div>
    )
  }

  if (estado === 'recusado') {
    return (
      <div
        className={cn(
          'rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-900',
          className,
        )}
      >
        <p className="font-semibold">❌ Recusado</p>
        {motivoRecusa ? (
          <p className="mt-1 leading-relaxed text-red-800">{motivoRecusa}</p>
        ) : null}
        {onRealocar ? (
          <button
            type="button"
            onClick={onRealocar}
            className="mt-2 rounded-md border border-red-300 bg-white px-2 py-1 text-[11px] font-semibold text-red-800 hover:bg-red-100"
          >
            Realocar
          </button>
        ) : null}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900',
        className,
      )}
    >
      ⏳ Aguardando confirmação
    </div>
  )
}
