import { cn } from '../../../lib/cn'
import type { SemanaEscalaPega } from '../../../lib/relatorios/montarGradeEscalaPegaPlantao'
import { LEGENDA_ESCALA_PEGA } from '../../../lib/relatorios/formatoPegaPlantao'
import { fmtPeriodoTilde } from '../../../lib/relatorios/formatoPegaPlantao'
import { RelatorioCabecalhoPegaPlantao } from './RelatorioCabecalhoPegaPlantao'

type Props = {
  dataInicio: string
  dataFim: string
  dataGeracao: string
  nomeEmpresa: string
  semanas: SemanaEscalaPega[]
  rotuloLocal?: string
  isLoading?: boolean
}

function SkeletonGrade() {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="h-24 rounded bg-gray-100" />
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
  rotuloLocal,
  isLoading = false,
}: Props) {
  const titulo = rotuloLocal
    ? `Escala de Plantões - Local: ${rotuloLocal.toUpperCase()} - Profissional de Plantão - ${fmtPeriodoTilde(dataInicio, dataFim)}`
    : `Escala de Plantões - Profissional de Plantão - ${fmtPeriodoTilde(dataInicio, dataFim)}`

  return (
    <>
      <RelatorioCabecalhoPegaPlantao
        nomeEmpresa={nomeEmpresa}
        titulo={titulo}
        dataGeracao={dataGeracao}
      />

      {isLoading ? (
        <SkeletonGrade />
      ) : semanas.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">
          Nenhum plantão no período para os filtros selecionados.
        </p>
      ) : (
        <div className="space-y-4">
          {semanas.map((semana, idxSemana) => (
            <div key={`semana-${idxSemana}`} className="break-inside-avoid">
              <table className="w-full border-collapse text-[8px] text-black">
                <thead>
                  <tr>
                    <th className="w-16 border border-gray-400 bg-gray-100 p-0.5" />
                    {semana.rotulosDias.map((rotulo) => (
                      <th
                        key={rotulo}
                        className="border border-gray-400 bg-gray-100 p-0.5 text-center font-bold uppercase"
                      >
                        {rotulo}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {semana.faixas.map((faixa) => (
                    <tr key={faixa.faixaRotulo}>
                      <td className="border border-gray-400 bg-gray-50 p-0.5 align-top font-semibold whitespace-nowrap">
                        {faixa.faixaRotulo}
                      </td>
                      {faixa.dias.map((celula, idxDia) => (
                        <td
                          key={`${faixa.faixaRotulo}-${idxDia}`}
                          className={cn(
                            'min-h-[36px] border border-gray-400 p-0.5 align-top',
                            celula.linhas.length === 0 && 'bg-gray-50/50',
                          )}
                        >
                          {celula.linhas.length === 0 ? (
                            <span className="text-gray-300"> </span>
                          ) : (
                            <div className="space-y-0.5">
                              {celula.linhas.map((linha, idx) => (
                                <p key={idx} className="leading-tight">
                                  {linha}
                                </p>
                              ))}
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      <footer className="mt-3 border-t border-gray-400 pt-1 text-[8px] leading-relaxed text-gray-700">
        {LEGENDA_ESCALA_PEGA}
      </footer>
    </>
  )
}
