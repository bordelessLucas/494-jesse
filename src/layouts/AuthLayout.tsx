import { Link, Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden bg-slate-950 bg-[url('/images/auth-bg.png')] bg-cover bg-center px-4 py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,theme(colors.primary.500/20),transparent_60%),radial-gradient(40%_35%_at_15%_15%,rgba(255,255,255,0.10),transparent_60%),radial-gradient(35%_30%_at_85%_10%,rgba(255,255,255,0.10),transparent_55%)]"
      />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 flex items-center justify-center">
          <div className="flex items-center gap-3 rounded-2xl border border-white/55 bg-white/85 px-4 py-3 shadow-[0_12px_30px_-18px_rgba(2,6,23,0.60)] ring-1 ring-slate-900/5 backdrop-blur-md">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white shadow-sm">
              <span className="text-base font-semibold leading-none">P</span>
            </div>
            <div className="leading-tight">
              <p className="text-lg font-semibold tracking-tight text-slate-950">
                PlantaoCheck
              </p>
              <p className="text-xs font-medium text-slate-600">
                Acesse sua conta
              </p>
            </div>
          </div>
        </div>

        <div className="relative rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-[0_10px_30px_-12px_rgba(15,23,42,0.25)] ring-1 ring-white/60 backdrop-blur sm:p-8">
          <Outlet />
        </div>

        <div className="mt-6 flex justify-center">
          <p className="max-w-[42ch] rounded-xl border border-white/55 bg-white/90 px-4 py-2 text-center text-xs text-slate-700 shadow-[0_10px_22px_-18px_rgba(2,6,23,0.65)] ring-1 ring-slate-900/5 backdrop-blur-md">
            Ao continuar, você concorda com os{' '}
            <Link to="/suporte/termos-uso" className="font-semibold text-blue-700 hover:underline">
              Termos de Uso
            </Link>{' '}
            e a{' '}
            <Link
              to="/suporte/politica-privacidade"
              className="font-semibold text-blue-700 hover:underline"
            >
              Política de Privacidade
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}

