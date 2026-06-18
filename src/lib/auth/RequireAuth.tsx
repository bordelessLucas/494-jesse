import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuthSession } from '../../contexts/AuthProvider'

type AuthGateProps = {
  children?: React.ReactNode
}

export function RequireAuth({ children }: AuthGateProps) {
  const location = useLocation()
  const { session, isLoading } = useAuthSession()

  if (isLoading) {
    return (
      <div className="grid min-h-dvh place-items-center bg-slate-50 px-4">
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-700 shadow-sm">
          Carregando sessão...
        </div>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children ? <>{children}</> : <Outlet />
}

export function RedirectIfAuthenticated({ children }: AuthGateProps) {
  const { session, isLoading } = useAuthSession()
  const isAuthenticated = Boolean(session)

  if (isLoading) return children ? <>{children}</> : <Outlet />

  if (isAuthenticated) return <Navigate to="/" replace />

  return children ? <>{children}</> : <Outlet />
}
