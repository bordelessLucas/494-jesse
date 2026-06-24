import { cn } from '../../../lib/cn'
import { BrandedLogoOrInitial } from '../../../components/branding/BrandedLogoOrInitial'
import {
  fmtPeriodo,
  LEGENDA_ESCALA,
  type CelulaCalendarioEscala,
} from '../relatoriosGerenciaisTypes'

type RelatorioEscalaFolhaProps = {
  dataInicio: string
  dataFim: string
  dataGeracao: string
  nomeEmpresa: string
  semanas: CelulaCalendarioEscala[][]
  isLoading?: boolean
}

function SkeletonGrade() {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }).map((__, j) => (
            <div key={j} className="min-h-[72px] rounded border border-gray-200 bg-gray-100" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function RelatorioEscalaFolha({
  dataInicio,
  dataFim,
  dataGeracao,
  nomeEmpresa,
  semanas,
  isLoading = false,
}: RelatorioEscalaFolhaProps) {
  return (
    <>
      <header className="mb-4 border-b border-gray-300 pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <BrandedLogoOrInitial
              className="h-12 w-12 shrink-0"
              surface="light"
              alt=""
            />
            <div className="min-w-0">
              <h1 className="text-base font-bold uppercase tracking-wide text-[#1e40af]">
                Escala de Plantões
              </h1>
              <p className="truncate text-xs text-gray-700">{nomeEmpresa}</p>
              <p className="text-xs text-gray-600">
                Período: {fmtPeriodo(dataInicio, dataFim)}
              </p>
            </div>
          </div>
          <p className="shrink-0 text-[10px] text-gray-600">
            Gerado em: {dataGeracao}
          </p>
        </div>
      </header>

      {isLoading ? (
        <SkeletonGrade />
      ) : (
        <div className="space-y-0">
          {semanas.map((semana, idxSemana) => (
            <div
              key={`semana-${idxSemana}`}
              className="grid grid-cols-7 border-collapse break-inside-avoid"
            >
              {semana.map((celula) => (
                <div
                  key={celula.iso}
                  className={cn(
                    'min-h-[72px] border border-gray-300 p-1',
                    celula.foraMes ? 'bg-gray-50 text-gray-400' : 'bg-white',
                  )}
                >
                  <p
                    className={cn(
                      'mb-0.5 border-b border-gray-200 pb-0.5 text-[10px] font-bold uppercase',
                      celula.foraMes ? 'text-gray-400' : 'text-gray-800',
                    )}
                  >
                    {celula.rotulo}
                  </p>
                  <div className="space-y-0.5">
                    {celula.linhas.length === 0 ? (
                      <p className="text-[9px] text-gray-400">—</p>
                    ) : (
                      celula.linhas.map((linha, idx) => (
                        <p
                          key={`${celula.iso}-${idx}`}
                          className="text-[9px] leading-tight text-gray-800"
                        >
                          {linha}
                        </p>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <footer className="mt-4 border-t border-gray-300 pt-2 text-[9px] leading-relaxed text-gray-700">
        {LEGENDA_ESCALA}
      </footer>
    </>
  )
}
