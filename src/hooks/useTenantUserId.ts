import { useContaMembro } from './useContaMembro'
import { useSupabaseUser } from './useSupabaseUser'

/**
 * ID do titular da conta para queries em `plantoes`, `profissionais`, etc.
 * Membros profissionais usam `tenant_user_id`; titular usa o próprio `auth.uid()`.
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
