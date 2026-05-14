import { ArrowLeft, Construction } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

const TITULOS: Record<string, string> = {
  grupos: 'Grupos',
  'tipos-plantao': 'Tipos de Plantão',
  'situacoes-plantao': 'Situações do Plantão',
  valores: 'Valores',
  'auto-ajustes': 'Auto-Ajustes',
  'tipos-contratacao': 'Tipos de Contratação',
  habilidades: 'Habilidades',
}

export function ConfiguracaoSecaoPage() {
  const { secao } = useParams()
  const titulo = secao ? TITULOS[secao] ?? secao : 'Configuração'

  return (
    <section className="mx-auto w-full max-w-4xl space-y-6">
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Configurações
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">{titulo}</h1>
        <p className="mt-2 text-sm text-slate-600">
          Esta seção está preparada para evoluir com o módulo completo.
        </p>

        <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-white text-slate-500 shadow-sm ring-1 ring-slate-200">
              <Construction className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Em desenvolvimento
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                O conteúdo desta aba será implementado na próxima etapa.
              </p>
            </div>
          </div>
        </div>

        <Link
          to="/configuracao"
          className="mt-6 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Voltar para Configurações
        </Link>
      </div>
    </section>
  )
}
