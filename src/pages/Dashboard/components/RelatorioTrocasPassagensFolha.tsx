import type { LinhaTrocaPassagem } from '../../../lib/relatorios/relatoriosPlantaoDb'
import {
  fmtDataHoraCurta,
  fmtDataPlantaoHora,
} from '../../../lib/relatorios/formatoPegaPlantao'
import {
  RelatorioCabecalhoPegaPlantao,
  RelatorioRodapeTotais,
  RelatorioTabelaPega,
  TdPega,
  ThPega,
} from './RelatorioCabecalhoPegaPlantao'

type Props = {
  linhas: LinhaTrocaPassagem[]
  nomeEmpresa: string
  dataGeracao: string
  dataInicio: string
  dataFim: string
  isLoading?: boolean
}

export function RelatorioTrocasPassagensFolha({
  linhas,
  nomeEmpresa,
  dataGeracao,
  dataInicio,
  dataFim,
  isLoading = false,
}: Props) {
  const trocas = linhas.filter((l) => l.tipo === 'troca').length
  const passagens = linhas.filter((l) => l.tipo === 'passagem').length

  return (
    <>
      <RelatorioCabecalhoPegaPlantao
        nomeEmpresa={nomeEmpresa}
        titulo="Trocas e Passagens entre Profissionais"
        dataGeracao={dataGeracao}
        periodoInicio={dataInicio}
        periodoFim={dataFim}
      />

      {isLoading ? (
        <div className="h-40 animate-pulse rounded bg-gray-100" />
      ) : (
        <RelatorioTabelaPega>
          <thead>
            <tr>
              <ThPega>Realizado em</ThPega>
              <ThPega>Plantão</ThPega>
              <ThPega>Requerente</ThPega>
              <ThPega>Requerido</ThPega>
              <ThPega>Plantão</ThPega>
              <ThPega>Justificativa</ThPega>
            </tr>
          </thead>
          <tbody>
            {linhas.length === 0 ? (
              <tr>
                <TdPega colSpan={6} className="py-6 text-center text-gray-500">
                  Nenhuma troca ou passagem no período.
                </TdPega>
              </tr>
            ) : (
              linhas.map((l) => (
                <tr key={l.id}>
                  <TdPega className="whitespace-nowrap">{fmtDataHoraCurta(l.realizadoEm)}</TdPega>
                  <TdPega>
                    <div>{fmtDataPlantaoHora(l.plantaoRequerenteData, l.plantaoRequerenteHora)}</div>
                    <div className="text-[8px] text-gray-600">{l.localSetorRequerente}</div>
                  </TdPega>
                  <TdPega>{l.requerenteNome}</TdPega>
                  <TdPega>{l.requeridoNome}</TdPega>
                  <TdPega>
                    {l.plantaoRequeridoData && l.plantaoRequeridoHora ? (
                      <>
                        <div>
                          {fmtDataPlantaoHora(l.plantaoRequeridoData, l.plantaoRequeridoHora)}
                        </div>
                        {l.localSetorRequerido ? (
                          <div className="text-[8px] text-gray-600">{l.localSetorRequerido}</div>
                        ) : null}
                      </>
                    ) : (
                      '—'
                    )}
                  </TdPega>
                  <TdPega>{l.justificativa || '—'}</TdPega>
                </tr>
              ))
            )}
          </tbody>
        </RelatorioTabelaPega>
      )}

      <RelatorioRodapeTotais>
        Trocas {trocas} &nbsp;&nbsp; Passagens {passagens}
      </RelatorioRodapeTotais>
    </>
  )
}
