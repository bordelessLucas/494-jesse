import type { LinhaCandidaturaRelatorio } from '../../../lib/relatorios/relatoriosPlantaoDb'
import {
  fmtDataHoraCurta,
  fmtDataPlantaoHora,
  fmtDuracaoHHMM,
} from '../../../lib/relatorios/formatoPegaPlantao'
import {
  RelatorioCabecalhoPegaPlantao,
  RelatorioRodapeTotais,
  RelatorioTabelaPega,
  TdPega,
  ThPega,
} from './RelatorioCabecalhoPegaPlantao'

type Props = {
  linhas: LinhaCandidaturaRelatorio[]
  nomeEmpresa: string
  dataGeracao: string
  dataInicio: string
  dataFim: string
  isLoading?: boolean
}

export function RelatorioCandidaturasFolha({
  linhas,
  nomeEmpresa,
  dataGeracao,
  dataInicio,
  dataFim,
  isLoading = false,
}: Props) {
  return (
    <>
      <RelatorioCabecalhoPegaPlantao
        nomeEmpresa={nomeEmpresa}
        titulo="Listagem de Candidaturas"
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
              <ThPega>Data/Hora Candidatura</ThPega>
              <ThPega>Profissional</ThPega>
              <ThPega>Status</ThPega>
              <ThPega>Data/Hora Plantão</ThPega>
              <ThPega>Duração (h)</ThPega>
              <ThPega>Setor</ThPega>
            </tr>
          </thead>
          <tbody>
            {linhas.length === 0 ? (
              <tr>
                <TdPega colSpan={6} className="py-6 text-center text-gray-500">
                  Nenhuma candidatura no período.
                </TdPega>
              </tr>
            ) : (
              linhas.map((l) => (
                <tr key={l.id}>
                  <TdPega className="whitespace-nowrap">
                    {fmtDataHoraCurta(l.dataHoraCandidatura)}
                  </TdPega>
                  <TdPega>{l.profissionalNome}</TdPega>
                  <TdPega>{l.status}</TdPega>
                  <TdPega className="whitespace-nowrap">
                    {fmtDataPlantaoHora(l.dataPlantao, l.horaInicio)}
                  </TdPega>
                  <TdPega className="text-center">
                    {fmtDuracaoHHMM(l.dataPlantao, l.horaInicio, l.horaFim)}
                  </TdPega>
                  <TdPega>{l.setorLabel}</TdPega>
                </tr>
              ))
            )}
          </tbody>
        </RelatorioTabelaPega>
      )}

      <RelatorioRodapeTotais>Total Geral {linhas.length} candidaturas</RelatorioRodapeTotais>
    </>
  )
}
