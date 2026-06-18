import { DashboardLayout } from './DashboardLayout'
import { ThemeBrandingProvider } from '../theme/ThemeBrandingProvider'

export function AuthenticatedLayout() {
  return (
    <ThemeBrandingProvider>
      <DashboardLayout />
    </ThemeBrandingProvider>
  )
}
