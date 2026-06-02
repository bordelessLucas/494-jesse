import { useContaMembro } from './useContaMembro'
import { useSupabaseUser } from './useSupabaseUser'

/**
 * ID do MASTER (dono da empresa) para queries em `plantoes`, `profissionais`, etc.
 * Funcionários usam `tenant_user_id` do titular; o MASTER usa o próprio `auth.uid()`.
 * Todos os dados ficam isolados por este ID (um tenant por empresa).
 */
export function useTenantUserId() {
  const { user, isLoading: authLoading } = useSupabaseUser()
  const {
    tenantUserId,
    isMembroProfissional,
    profissionalId,
    permissoes,
    isLoading: membroLoading,
  } = useContaMembro()

  return {
    user,
    tenantUserId,
    isMembroProfissional,
    profissionalIdMembro: profissionalId,
    permissoes,
    isLoading: authLoading || membroLoading,
  }
}
