import { Loader2 } from 'lucide-react'

import { BrandLogo } from './branding/BrandLogo'

export function PageLoader() {
  return (
    <div className="grid min-h-[40vh] place-items-center px-4">
      <div className="ug-card flex flex-col items-center gap-4 px-8 py-7 text-sm text-ug-celestial">
        <BrandLogo variant="symbol" surface="light" tone="color" size={40} decorative />
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary-600" aria-hidden />
          Carregando…
        </div>
      </div>
    </div>
  )
}
