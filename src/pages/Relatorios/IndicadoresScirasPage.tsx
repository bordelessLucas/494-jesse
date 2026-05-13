import { FormularioIndicadores } from '../../features/sciras/components/FormularioIndicadores'

export function IndicadoresScirasPage() {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">
          Indicadores clínicos SCIRAS
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-600">
          Recolha mensal das tabelas de UTI (busca activa) e do centro
          cirúrgico (taxa de infecção em cirurgias limpas). Os valores
          calculados são preenchidos automaticamente antes de guardar.
        </p>
      </div>
      <FormularioIndicadores />
    </div>
  )
}
