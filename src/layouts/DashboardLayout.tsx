import { Outlet } from 'react-router-dom'

import { Sidebar } from '../components/Sidebar'
import { Topbar } from '../components/Topbar'

export function DashboardLayout() {
  return (
    <div className="min-h-dvh bg-gray-50">
      <Sidebar />

      <div className="md:pl-64">
        <Topbar />

        <main className="px-4 py-6 md:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

