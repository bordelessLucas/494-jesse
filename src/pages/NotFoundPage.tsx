import { Link } from 'react-router-dom'

import { BrandLogo } from '../components/branding/BrandLogo'

export function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-lg flex-col items-center justify-center px-4 text-center">
      <BrandLogo variant="symbol" surface="light" tone="color" size={56} decorative />
      <h1 className="ug-page-title mt-6">Página não encontrada</h1>
      <p className="ug-page-subtitle max-w-sm">
        A rota acessada não existe ou foi movida. Verifique o endereço ou volte ao painel.
      </p>
      <Link to="/" className="ug-btn-primary mt-8 px-6">
        Ir para o início
      </Link>
    </div>
  )
}
