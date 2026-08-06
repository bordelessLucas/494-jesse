import { Link, Outlet } from 'react-router-dom'

import { BrandLogo } from '../components/branding/BrandLogo'

export function AuthLayout() {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-10 sm:px-6">
      {/* Fundo institucional full-bleed — visível em qualquer viewport */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <img
          src="/images/auth-bg-unique-gestor.png"
          alt=""
          className="h-full w-full object-cover object-center"
        />
        {/* Escurece só o suficiente para o card e a logo lerem bem */}
        <div className="absolute inset-0 bg-ug-petrol/45" />
        <div className="absolute inset-0 bg-[radial-gradient(70%_55%_at_50%_40%,transparent_0%,rgb(7_11_19/0.45)_100%)]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-7 flex flex-col items-center gap-3">
          <BrandLogo
            variant="horizontal"
            surface="dark"
            tone="color"
            size={44}
            className="drop-shadow-[0_4px_20px_rgb(7_11_19/0.5)]"
          />
          <p className="text-sm font-medium text-ug-porcelain/80">
            Acesse sua conta
          </p>
        </div>

        <div className="rounded-ug-lg border border-white/40 bg-white/95 p-6 shadow-ug-lg backdrop-blur-md sm:p-8">
          <Outlet />
        </div>

        <p className="mt-6 text-center text-xs leading-relaxed text-ug-porcelain/75">
          Ao continuar, você concorda com os{' '}
          <Link
            to="/suporte/termos-uso"
            className="font-semibold text-white underline-offset-2 hover:underline"
          >
            Termos de Uso
          </Link>{' '}
          e a{' '}
          <Link
            to="/suporte/politica-privacidade"
            className="font-semibold text-white underline-offset-2 hover:underline"
          >
            Política de Privacidade
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
