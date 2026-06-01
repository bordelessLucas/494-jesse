import { useCallback, useEffect, useState } from 'react'

import { buscarContaMembroAtual, type ContaMembroRow } from '../lib/auth/contaMembroDb'
import { useSupabaseUser } from './useSupabaseUser'

function normalizarPermissoes(raw: unknown): Record<string, boolean> {
  if (!raw || typeof raw !== 'object') return {}
  const out: Record<string, boolean> = {}
  for (const [chave, valor] of Object.entries(raw as Record<string, unknown>)) {
    out[chave] = valor === true || valor === 'true' || valor === 1
  }
  return out
}

export type ContaMembroContext = {
  isLoading: boolean
  /** Titular da conta (dono) — acesso total. */
  isTitular: boolean
  /** Profissional convidado com login próprio. */
  isMembroProfissional: boolean
  membro: ContaMembroRow | null
  permissoes: Record<string, boolean>
  mustChangePassword: boolean
  profissionalId: string | null
  tenantUserId: string | null
  recarregar: () => Promise<void>
}

export function useContaMembro(): ContaMembroContext {
  const { user, isLoading: authLoading } = useSupabaseUser()
  const [membro, setMembro] = useState<ContaMembroRow | null>(null)
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    if (!user?.id) {
      setMembro(null)
      setCarregando(false)
      return
    }
    setCarregando(true)
    try {
      const row = await buscarContaMembroAtual(user.id)
      setMembro(row)
    } catch {
      setMembro(null)
    } finally {
      setCarregando(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (authLoading) return
    void carregar()
  }, [authLoading, carregar])

  const isMembroProfissional = Boolean(membro)
  const isTitular = Boolean(user) && !isMembroProfissional

  return {
    isLoading: authLoading || carregando,
    isTitular,
    isMembroProfissional,
    membro,
    permissoes: normalizarPermissoes(membro?.permissoes),
    mustChangePassword: membro?.must_change_password ?? false,
    profissionalId: membro?.profissional_id ?? null,
    tenantUserId: membro?.tenant_user_id ?? user?.id ?? null,
    recarregar: carregar,
  }
}
