import { Loader2 } from 'lucide-react'
import { Navigate, useLocation } from 'react-router-dom'

import {
  rotaInicialMembro,
  rotaPermitidaParaMembro,
} from '../Profissionais/profissionalAcessoTypes'
import { useContaMembro } from '../../hooks/useContaMembro'
import {
  rotaInicialVisualizador,
  rotaPermitidaParaVisualizador,
} from '../../lib/visualizadores/visualizadorTypes'

/** Bloqueia rotas não autorizadas para profissionais convidados. */
export function MembroAcessoGuard({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const {
    isLoading,
    isMembroProfissional,
    isVisualizador,
    permissoes,
    mustChangePassword,
  } = useContaMembro()

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          A preparar o seu acesso…
        </div>
      </div>
    )
  }

  const isMembroConvidado = isMembroProfissional || isVisualizador

  if (isMembroConvidado && mustChangePassword) {
    if (location.pathname !== '/alterar-senha-obrigatoria') {
      return <Navigate to="/alterar-senha-obrigatoria" replace />
    }
    return <>{children}</>
  }

  if (isVisualizador) {
    if (!rotaPermitidaParaVisualizador(location.pathname, permissoes)) {
      return <Navigate to={rotaInicialVisualizador(permissoes)} replace />
    }
    return <>{children}</>
  }

  if (isMembroProfissional) {
    if (!rotaPermitidaParaMembro(location.pathname, permissoes)) {
      return <Navigate to={rotaInicialMembro(permissoes)} replace />
    }
  }

  return <>{children}</>
}
