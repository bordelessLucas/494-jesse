import { Outlet } from 'react-router-dom'

import { Sidebar } from '../components/Sidebar'
import { Topbar } from '../components/Topbar'

export function DashboardLayout() {
  return (
    <div className="flex min-h-dvh bg-slate-50">
      <Sidebar />

      <div className="min-w-0 flex-1">
        <Topbar />

        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

