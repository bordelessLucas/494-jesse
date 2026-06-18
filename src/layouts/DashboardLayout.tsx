import { useCallback, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

import { MembroAcessoGuard } from '../components/auth/MembroAcessoGuard'
import { MobileNavDrawer } from '../components/MobileNavDrawer'
import { ContaMembroProvider } from '../contexts/ContaMembroProvider'
import { PreloadCatalogoLocaisSetores } from '../components/catalogo/PreloadCatalogoLocaisSetores'
import { Sidebar } from '../components/Sidebar'
import { SuporteChatWidget } from '../components/support/SuporteChatWidget'
import { Topbar } from '../components/Topbar'
import { useMuralTrocasAlertas } from '../hooks/useMuralTrocasAlertas'
import { useNotificacoesRealtime } from '../hooks/useNotificacoes'

function DashboardRealtimeListeners() {
  useMuralTrocasAlertas()
  useNotificacoesRealtime()
  return null
}

export function DashboardLayout() {
  const [mobileNavAberto, setMobileNavAberto] = useState(false)
  const abrirMobileNav = useCallback(() => setMobileNavAberto(true), [])
  const fecharMobileNav = useCallback(() => setMobileNavAberto(false), [])

  return (
    <ContaMembroProvider>
      <PreloadCatalogoLocaisSetores />
      <DashboardRealtimeListeners />
      <div className="flex min-h-dvh bg-slate-50 print:block print:min-h-0 print:bg-white">
        <Sidebar />
        <MobileNavDrawer aberto={mobileNavAberto} onFechar={fecharMobileNav} />

        <div className="min-w-0 flex-1">
          <Topbar onAbrirMenuMobile={abrirMobileNav} />

          <main className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:p-8 print:p-0">
            <MembroAcessoGuard>
              <Outlet />
            </MembroAcessoGuard>
          </main>
        </div>

        <SuporteChatWidget />

        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3500,
            style: {
              borderRadius: '14px',
              background: '#ffffff',
              color: '#0f172a',
              boxShadow: '0 20px 40px rgba(15, 23, 42, 0.12)',
              border: '1px solid rgba(148, 163, 184, 0.35)',
            },
          }}
        />
      </div>
    </ContaMembroProvider>
  )
}
