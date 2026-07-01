import type { LinhaFaltaRelatorio } from '../../../lib/relatorios/relatoriosPlantaoDb'
import { fmtDiaSemanaCurto, fmtDuracaoHHMM } from '../../../lib/relatorios/formatoPegaPlantao'
import {
  RelatorioCabecalhoPegaPlantao,
  RelatorioTabelaPega,
  TdPega,
  ThPega,
} from './RelatorioCabecalhoPegaPlantao'

type Props = {
  linhas: LinhaFaltaRelatorio[]
  nomeEmpresa: string
  dataGeracao: string
  dataInicio: string
  dataFim: string
  isLoading?: boolean
}

export function RelatorioFaltasFolha({
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
        titulo="Listagem de Faltas"
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
              <ThPega>Fixo</ThPega>
              <ThPega>Situação</ThPega>
              <ThPega>Responsável</ThPega>
              <ThPega>Tipo</ThPega>
              <ThPega>Obs. Interna</ThPega>
            </tr>
          </thead>
          <tbody>
            {linhas.length === 0 ? (
              <tr>
                <TdPega colSpan={8} className="py-6 text-center text-gray-500">
                  Nenhuma falta/troca registada no período.
                </TdPega>
              </tr>
            ) : (
              linhas.map((l) => (
                <tr key={l.id}>
                  <TdPega className="whitespace-nowrap">
                    <div>{fmtDiaSemanaCurto(l.dataPlantao)}</div>
                    <div className="text-[8px] text-gray-600">
                      {l.horaInicio.slice(0, 5)}
                    </div>
                  </TdPega>
                  <TdPega className="text-center">
                    {fmtDuracaoHHMM(l.dataPlantao, l.horaInicio, l.horaFim)}
                  </TdPega>
                  <TdPega>{l.setorLabel}</TdPega>
                  <TdPega>{l.fixoNome}</TdPega>
                  <TdPega>{l.situacao}</TdPega>
                  <TdPega>{l.responsavelNome}</TdPega>
                  <TdPega>{l.tipo}</TdPega>
                  <TdPega>{l.obsInterna || '—'}</TdPega>
                </tr>
              ))
            )}
          </tbody>
        </RelatorioTabelaPega>
      )}
    </>
  )
}
