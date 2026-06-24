import { useEffect } from 'react'

import { useContaMembro } from './useContaMembro'
import { useConfirmacaoEscalaStore } from './useConfirmacaoEscala'

/** Carrega plantões pendentes de confirmação para o profissional logado. */
export function useConfirmacaoEscalaLoader() {
  const { isMembroProfissional, profissionalId, tenantUserId, isLoading } =
    useContaMembro()
  const carregar = useConfirmacaoEscalaStore((s) => s.carregar)
  const reset = useConfirmacaoEscalaStore((s) => s.reset)

  useEffect(() => {
    if (isLoading) return

    if (!isMembroProfissional || !profissionalId || !tenantUserId) {
      reset()
      return
    }

    void carregar(profissionalId, tenantUserId)
  }, [isLoading, isMembroProfissional, profissionalId, tenantUserId, carregar, reset])
}
