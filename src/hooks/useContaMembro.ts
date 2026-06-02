import { useCallback, useEffect, useState } from 'react'

import { buscarContaMembroAtual, type ContaMembroRow } from '../lib/auth/contaMembroDb'
import { buscarEmpresaDoTenant, type EmpresaRow } from '../lib/auth/empresaDb'
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
  /** Dono da empresa no cadastro SaaS (sinónimo de isTitular). */
  isMaster: boolean
  /** Profissional convidado com login próprio. */
  isMembroProfissional: boolean
  membro: ContaMembroRow | null
  empresa: EmpresaRow | null
  permissoes: Record<string, boolean>
  mustChangePassword: boolean
  profissionalId: string | null
  tenantUserId: string | null
  recarregar: () => Promise<void>
}

export function useContaMembro(): ContaMembroContext {
  const { user, isLoading: authLoading } = useSupabaseUser()
  const [membro, setMembro] = useState<ContaMembroRow | null>(null)
  const [empresa, setEmpresa] = useState<EmpresaRow | null>(null)
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    if (!user?.id) {
      setMembro(null)
      setEmpresa(null)
      setCarregando(false)
      return
    }
    setCarregando(true)
    try {
      const [row, emp] = await Promise.all([
        buscarContaMembroAtual(user.id),
        buscarEmpresaDoTenant(user.id),
      ])
      setMembro(row)
      setEmpresa(emp)
    } catch {
      setMembro(null)
      setEmpresa(null)
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
  const isMaster = isTitular

  return {
    isLoading: authLoading || carregando,
    isTitular,
    isMaster,
    isMembroProfissional,
    membro,
    empresa,
    permissoes: normalizarPermissoes(membro?.permissoes),
    mustChangePassword: membro?.must_change_password ?? false,
    profissionalId: membro?.profissional_id ?? null,
    tenantUserId: membro?.tenant_user_id ?? user?.id ?? null,
    recarregar: carregar,
  }
}
