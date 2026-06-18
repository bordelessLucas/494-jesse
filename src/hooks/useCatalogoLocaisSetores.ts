import { useEffect } from 'react'

import { useContaMembro } from './useContaMembro'
import { useCatalogoLocaisSetoresStore } from '../stores/catalogoLocaisSetoresStore'

/**
 * Garante catálogo de locais/setores em memória (uma carga por tenant).
 * Retorna seletores estáveis para evitar re-renders amplos nas páginas.
 */
export function useCatalogoLocaisSetores() {
  const { tenantUserId, isLoading: contaLoading } = useContaMembro()
  const locais = useCatalogoLocaisSetoresStore((s) => s.locais)
  const setores = useCatalogoLocaisSetoresStore((s) => s.setores)
  const setoresPorLocalId = useCatalogoLocaisSetoresStore((s) => s.setoresPorLocalId)
  const isLoading = useCatalogoLocaisSetoresStore((s) => s.isLoading)
  const error = useCatalogoLocaisSetoresStore((s) => s.error)
  const carregar = useCatalogoLocaisSetoresStore((s) => s.carregar)
  const getSetoresDoLocal = useCatalogoLocaisSetoresStore((s) => s.getSetoresDoLocal)

  useEffect(() => {
    if (contaLoading || !tenantUserId) return
    void carregar(tenantUserId)
  }, [carregar, contaLoading, tenantUserId])

  return {
    tenantUserId,
    locais,
    setores,
    setoresPorLocalId,
    getSetoresDoLocal,
    isLoading: contaLoading || isLoading,
    error,
    recarregar: () => {
      if (!tenantUserId) return Promise.resolve()
      return carregar(tenantUserId, { forcar: true })
    },
  }
}
