import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import {
  PERMISSOES_PROFISSIONAL,
  permissoesProfissionalPadrao,
} from '../components/Profissionais/profissionalAcessoTypes'
import { buscarContaMembroAtual, type ContaMembroRow } from '../lib/auth/contaMembroDb'
import { buscarEmpresaDoTenant, type EmpresaRow } from '../lib/auth/empresaDb'
import { useSupabaseUser } from '../hooks/useSupabaseUser'
import type { ContaMembroContext } from '../hooks/useContaMembro'

function normalizarPermissoes(raw: unknown): Record<string, boolean> {
  if (!raw || typeof raw !== 'object') return {}
  const out: Record<string, boolean> = {}
  for (const [chave, valor] of Object.entries(raw as Record<string, unknown>)) {
    out[chave] = valor === true || valor === 'true' || valor === 1
  }
  return out
}

/** Permissões do membro: padrão para chaves ausentes, BD prevalece quando a chave existe. */
export function resolverPermissoesMembro(raw: unknown): Record<string, boolean> {
  const fromDb = normalizarPermissoes(raw)
  const out = permissoesProfissionalPadrao()
  for (const { key } of PERMISSOES_PROFISSIONAL) {
    if (key in fromDb) {
      out[key] = fromDb[key]
    }
  }
  return out
}

const ContaMembroContext = createContext<ContaMembroContext | null>(null)

export function ContaMembroProvider({ children }: { children: ReactNode }) {
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
    } catch (e) {
      console.error('Falha ao carregar conta membro:', e)
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

  const permissoes = useMemo(
    () => (membro ? resolverPermissoesMembro(membro.permissoes) : {}),
    [membro],
  )

  const value = useMemo(
    (): ContaMembroContext => ({
      isLoading: authLoading || carregando,
      isTitular,
      isMaster,
      isMembroProfissional,
      membro,
      empresa,
      permissoes,
      mustChangePassword: membro?.must_change_password ?? false,
      profissionalId: membro?.profissional_id ?? null,
      tenantUserId: membro?.tenant_user_id ?? user?.id ?? null,
      recarregar: carregar,
    }),
    [
      authLoading,
      carregando,
      isTitular,
      isMaster,
      isMembroProfissional,
      membro,
      empresa,
      permissoes,
      user?.id,
      carregar,
    ],
  )

  return <ContaMembroContext.Provider value={value}>{children}</ContaMembroContext.Provider>
}

export function useContaMembroContext(): ContaMembroContext {
  const ctx = useContext(ContaMembroContext)
  if (!ctx) {
    throw new Error('useContaMembro deve ser usado dentro de ContaMembroProvider')
  }
  return ctx
}
