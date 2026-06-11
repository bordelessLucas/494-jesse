import { useContaMembroContext } from '../contexts/ContaMembroProvider'
import type { ContaMembroRow } from '../lib/auth/contaMembroDb'
import type { EmpresaRow } from '../lib/auth/empresaDb'

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
  return useContaMembroContext()
}
