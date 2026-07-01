import { ArrowLeft } from 'lucide-react'
import { Link, Navigate, NavLink, useParams } from 'react-router-dom'

import { cn } from '../../lib/cn'
import {
  SECOES_PARAMETROS,
  SECOES_POR_SLUG,
  secaoValida,
} from '../../lib/configuracao/parametrosConfig'
import { ConfigParametrosCrud } from './components/ConfigParametrosCrud'

export function ConfiguracaoParametrosPage() {
  const { secao } = useParams()

  if (!secaoValida(secao)) {
    return <Navigate to="/configuracao/grupos" replace />
  }

  const configAtiva = SECOES_POR_SLUG[secao]

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6 pb-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Configurações · Parametrização
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">Operação</h1>
          <p className="mt-1 text-sm text-slate-600">
            Catálogos operacionais isolados por empresa (tenant).
          </p>
        </div>
        <Link
          to="/configuracao"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <nav
          className="flex min-w-max gap-0 border-b border-slate-200 px-2 pt-2"
          aria-label="Secções de parametrização"
        >
          {SECOES_PARAMETROS.map((sec) => (
            <NavLink
              key={sec.slug}
              to={`/configuracao/${sec.slug}`}
              className={({ isActive }) =>
                cn(
                  'whitespace-nowrap rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'border border-b-white border-slate-200 bg-white text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                )
              }
            >
              {sec.titulo}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900">{configAtiva.titulo}</h2>
          <ConfigParametrosCrud key={secao} config={configAtiva} />
        </div>
      </div>
    </section>
  )
}
