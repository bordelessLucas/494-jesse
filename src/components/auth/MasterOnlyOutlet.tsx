import { Outlet } from 'react-router-dom'

import { MasterOnlyGuard } from './MasterOnlyGuard'

export function MasterOnlyOutlet() {
  return (
    <MasterOnlyGuard>
      <Outlet />
    </MasterOnlyGuard>
  )
}
