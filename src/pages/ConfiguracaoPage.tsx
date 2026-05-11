import { Link } from 'react-router-dom'
import { Palette } from 'lucide-react'

export function ConfiguracaoPage() {
  return (
    <section className="mx-auto w-full max-w-4xl space-y-6">
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-lg font-semibold text-slate-900">Configuração</h1>
        <p className="mt-2 text-sm text-slate-600">
          Preferências gerais da conta e da interface.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-base font-semibold text-slate-900">
          Aparência e white label
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Defina a cor principal e o logotipo usados na barra lateral e no topo.
        </p>
        <Link
          to="/configuracao/marca"
          className="mt-4 inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-primary-700 shadow-sm transition-colors hover:border-primary-300 hover:bg-primary-50/50"
        >
          <Palette className="h-4 w-4" aria-hidden />
          Abrir marca da plataforma
        </Link>
      </div>
    </section>
  )
}

