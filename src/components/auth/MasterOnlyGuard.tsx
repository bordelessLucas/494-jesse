import { Loader2 } from 'lucide-react'
import { Navigate } from 'react-router-dom'

import { useContaMembro } from '../../hooks/useContaMembro'

/**
 * Rotas exclusivas do MASTER (dono da empresa): configurações, usuários, financeiro completo, etc.
 */
export function MasterOnlyGuard({ children }: { children: React.ReactNode }) {
  const { isLoading, isMaster } = useContaMembro()

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          A verificar permissões…
        </div>
      </div>
    )
  }

  if (!isMaster) {
    return <Navigate to="/meus-dados" replace />
  }

  return <>{children}</>
}
