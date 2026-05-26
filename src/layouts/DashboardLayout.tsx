import { Outlet } from 'react-router-dom'

import { MembroAcessoGuard } from '../components/auth/MembroAcessoGuard'
import { Sidebar } from '../components/Sidebar'
import { SuporteChatWidget } from '../components/support/SuporteChatWidget'
import { Topbar } from '../components/Topbar'

export function DashboardLayout() {
  return (
    <div className="flex min-h-dvh bg-slate-50 print:block print:min-h-0 print:bg-white">
      <Sidebar />

      <div className="min-w-0 flex-1">
        <Topbar />

        <main className="p-8 print:p-0">
          <MembroAcessoGuard>
            <Outlet />
          </MembroAcessoGuard>
        </main>
      </div>

      <SuporteChatWidget />
    </div>
  )
}

