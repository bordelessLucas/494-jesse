import { Loader2 } from 'lucide-react'

type EmissaoRelatorioCarregandoProps = {
  titulo: string
}

export function EmissaoRelatorioCarregando({ titulo }: EmissaoRelatorioCarregandoProps) {
  return (
    <div className="-m-8 flex min-h-[60vh] items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" aria-hidden />
        <p className="text-sm font-medium text-slate-800">{titulo}</p>
        <p className="max-w-xs text-xs text-slate-500">A preparar dados e preview do relatório…</p>
      </div>
    </div>
  )
}
