import { memo, startTransition, useMemo } from 'react'

import { cn } from '../../lib/cn'
import { useCatalogoLocaisSetoresStore } from '../../stores/catalogoLocaisSetoresStore'

const SELECT_CLASS =
  'rounded-lg border border-slate-200 bg-white py-2.5 pl-3 pr-8 text-sm text-slate-900 shadow-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100'

type SeletorLocalSetorProps = {
  localId: string
  setorId: string
  onLocalChange: (localId: string) => void
  onSetorChange: (setorId: string) => void
  localLabel?: string
  setorLabel?: string
  incluirTodosLocais?: boolean
  incluirTodosSetores?: boolean
  todosLocaisValue?: string
  todosSetoresValue?: string
  disabled?: boolean
  className?: string
  selectClassName?: string
  layout?: 'row' | 'stack'
}

export const SeletorLocalSetor = memo(function SeletorLocalSetor({
  localId,
  setorId,
  onLocalChange,
  onSetorChange,
  localLabel = 'Local / Hospital',
  setorLabel = 'Setor',
  incluirTodosLocais = false,
  incluirTodosSetores = false,
  todosLocaisValue = '',
  todosSetoresValue = '',
  disabled = false,
  className,
  selectClassName = SELECT_CLASS,
  layout = 'row',
}: SeletorLocalSetorProps) {
  const locais = useCatalogoLocaisSetoresStore((s) => s.locais)
  const getSetoresDoLocal = useCatalogoLocaisSetoresStore((s) => s.getSetoresDoLocal)
  const isLoading = useCatalogoLocaisSetoresStore((s) => s.isLoading)

  const setoresDoLocal = useMemo(
    () => getSetoresDoLocal(localId),
    [getSetoresDoLocal, localId],
  )

  const desabilitado = disabled || isLoading

  return (
    <div
      className={cn(
        layout === 'row'
          ? 'grid gap-4 sm:grid-cols-2'
          : 'flex flex-col gap-3',
        className,
      )}
    >
      <label className="flex min-w-0 flex-col gap-1 text-sm font-medium text-slate-700">
        {localLabel}
        <select
          className={selectClassName}
          value={localId}
          disabled={desabilitado || locais.length === 0}
          onChange={(e) => {
            const valor = e.target.value
            startTransition(() => onLocalChange(valor))
          }}
        >
          {incluirTodosLocais ? (
            <option value={todosLocaisValue}>Todos os locais</option>
          ) : null}
          {locais.map((local) => (
            <option key={local.id} value={local.id}>
              {local.nome}
            </option>
          ))}
        </select>
      </label>

      <label className="flex min-w-0 flex-col gap-1 text-sm font-medium text-slate-700">
        {setorLabel}
        <select
          className={selectClassName}
          value={setorId}
          disabled={desabilitado || (!incluirTodosSetores && setoresDoLocal.length === 0)}
          onChange={(e) => {
            const valor = e.target.value
            startTransition(() => onSetorChange(valor))
          }}
        >
          {incluirTodosSetores ? (
            <option value={todosSetoresValue}>Todos os setores</option>
          ) : null}
          {setoresDoLocal.map((setor) => (
            <option key={setor.id} value={setor.id}>
              {setor.nome}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
})
