import { Loader2 } from 'lucide-react'
import { Navigate } from 'react-router-dom'

import { rotaInicialMembro } from '../Profissionais/profissionalAcessoTypes'
import { useContaMembro } from '../../hooks/useContaMembro'

export function RotaInicial() {
  const { isLoading, isMembroProfissional, permissoes } = useContaMembro()

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-slate-600">
        <Loader2 className="h-6 w-6 animate-spin text-primary-600" aria-hidden />
        <span>A carregar…</span>
      </div>
    )
  }

  if (isMembroProfissional) {
    return <Navigate to={rotaInicialMembro(permissoes)} replace />
  }

  return <Navigate to="/painel/resumo" replace />
}
