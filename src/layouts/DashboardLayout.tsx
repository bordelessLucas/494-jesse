import { useCallback, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { MembroAcessoGuard } from '../components/auth/MembroAcessoGuard'
import { BannerConfirmacaoPendente } from '../components/ConfirmacaoEscala/BannerConfirmacaoPendente'
import { MobileNavDrawer } from '../components/MobileNavDrawer'
import { ContaMembroProvider } from '../contexts/ContaMembroProvider'
import { PreloadCatalogoLocaisSetores } from '../components/catalogo/PreloadCatalogoLocaisSetores'
import { Sidebar } from '../components/Sidebar'
import { SuporteChatWidget } from '../features/suporte/components/ChatWidget/SuporteChatWidget'
import { Topbar } from '../components/Topbar'
import { useMuralTrocasAlertas } from '../hooks/useMuralTrocasAlertas'
import { useNotificacoesRealtime } from '../hooks/useNotificacoes'
import { useConfirmacaoEscalaLoader } from '../hooks/useConfirmacaoEscalaLoader'

function DashboardRealtimeListeners() {
  useMuralTrocasAlertas()
  useNotificacoesRealtime()
  useConfirmacaoEscalaLoader()
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
        <BannerConfirmacaoPendente />
      </div>
    </ContaMembroProvider>
  )
}
