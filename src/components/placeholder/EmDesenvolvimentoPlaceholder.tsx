import { Construction } from 'lucide-react'

type EmDesenvolvimentoPlaceholderProps = {
  titulo: string
  secao?: string
}

export function EmDesenvolvimentoPlaceholder({
  titulo,
  secao,
}: EmDesenvolvimentoPlaceholderProps) {
  return (
    <section className="mx-auto w-full max-w-4xl space-y-6">
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
        {secao ? (
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {secao}
          </p>
        ) : null}
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">{titulo}</h1>

        <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-white text-slate-500 shadow-sm ring-1 ring-slate-200">
              <Construction className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Em desenvolvimento</h2>
              <p className="mt-1 text-sm text-slate-600">
                Esta funcionalidade será disponibilizada em breve.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
