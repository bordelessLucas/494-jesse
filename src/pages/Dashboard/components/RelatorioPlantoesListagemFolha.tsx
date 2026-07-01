import type { LinhaPlantaoListagem } from '../../../lib/relatorios/relatoriosPlantaoDb'
import {
  fmtBRLPega,
  fmtDataPlantaoHora,
  fmtDuracaoHHMM,
  somarDuracoesHHMM,
} from '../../../lib/relatorios/formatoPegaPlantao'
import {
  RelatorioCabecalhoPegaPlantao,
  RelatorioRodapeTotais,
  RelatorioTabelaPega,
  TdPega,
  ThPega,
} from './RelatorioCabecalhoPegaPlantao'

type Props = {
  linhas: LinhaPlantaoListagem[]
  nomeEmpresa: string
  dataGeracao: string
  dataInicio: string
  dataFim: string
  rotuloLocal?: string
  isLoading?: boolean
}

export function RelatorioPlantoesListagemFolha({
  linhas,
  nomeEmpresa,
  dataGeracao,
  dataInicio,
  dataFim,
  rotuloLocal,
  isLoading = false,
}: Props) {
  const totalDuracao = somarDuracoesHHMM(
    linhas.map((l) => fmtDuracaoHHMM(l.dataPlantao, l.horaInicio, l.horaFim)),
  )
  const totalValor = linhas.reduce((acc, l) => acc + l.valor, 0)

  const titulo = rotuloLocal
    ? `Listagem de Plantões - Local: ${rotuloLocal.toUpperCase()}`
    : 'Listagem de Plantões'

  return (
    <>
      <RelatorioCabecalhoPegaPlantao
        nomeEmpresa={nomeEmpresa}
        titulo={titulo}
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
              <ThPega>Data</ThPega>
              <ThPega>Duração (h)</ThPega>
              <ThPega>Setor</ThPega>
              <ThPega>Responsável</ThPega>
              <ThPega>Tipo</ThPega>
              <ThPega>Valor</ThPega>
            </tr>
          </thead>
          <tbody>
            {linhas.length === 0 ? (
              <tr>
                <TdPega colSpan={6} className="py-6 text-center text-gray-500">
                  Nenhum plantão no período.
                </TdPega>
              </tr>
            ) : (
              linhas.map((l) => (
                <tr key={l.id}>
                  <TdPega className="whitespace-nowrap">
                    {fmtDataPlantaoHora(l.dataPlantao, l.horaInicio)}
                  </TdPega>
                  <TdPega className="text-center">
                    {fmtDuracaoHHMM(l.dataPlantao, l.horaInicio, l.horaFim)}
                  </TdPega>
                  <TdPega>{l.setorLabel}</TdPega>
                  <TdPega>{l.responsavelNome}</TdPega>
                  <TdPega>{l.tipo}</TdPega>
                  <TdPega className="text-right whitespace-nowrap">{fmtBRLPega(l.valor)}</TdPega>
                </tr>
              ))
            )}
          </tbody>
        </RelatorioTabelaPega>
      )}

      <RelatorioRodapeTotais>
        Total Geral &nbsp; {totalDuracao} &nbsp; {linhas.length} Plantões &nbsp;{' '}
        {fmtBRLPega(totalValor)}
      </RelatorioRodapeTotais>
    </>
  )
}
