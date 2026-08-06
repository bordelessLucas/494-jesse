import { Construction } from 'lucide-react'

import { BrandLogo } from '../branding/BrandLogo'

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
      <div className="ug-card p-6 sm:p-8">
        {secao ? (
          <p className="text-xs font-semibold uppercase tracking-wide text-ug-muted">
            {secao}
          </p>
        ) : null}
        <h1 className="ug-page-title mt-1 text-2xl">{titulo}</h1>

        <div className="mt-6 rounded-ug border border-dashed border-ug-border bg-ug-bg p-5">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-ug-surface text-ug-celestial shadow-ug ring-1 ring-ug-border">
              <Construction className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-3">
                <BrandLogo variant="symbol" surface="light" tone="color" size={28} decorative />
              </div>
              <h2 className="text-sm font-semibold text-ug-petrol">Em desenvolvimento</h2>
              <p className="mt-1 text-sm text-ug-muted">
                Esta funcionalidade será disponibilizada em breve na Unique Gestor.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
