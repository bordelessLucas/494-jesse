import type { GrupoPagamentoProfissional } from '../../../lib/relatorios/relatoriosPlantaoDb'
import {
  fmtBRLPega,
  fmtDataPlantaoHora,
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
  grupos: GrupoPagamentoProfissional[]
  nomeEmpresa: string
  dataGeracao: string
  dataInicio: string
  dataFim: string
  rotuloLocal?: string
  isLoading?: boolean
}

export function RelatorioPagamentosFolha({
  grupos,
  nomeEmpresa,
  dataGeracao,
  dataInicio,
  dataFim,
  rotuloLocal,
  isLoading = false,
}: Props) {
  const totalPlantoes = grupos.reduce((acc, g) => acc + g.totalPlantoes, 0)
  const totalDuracao = somarDuracoesHHMM(grupos.map((g) => g.totalDuracao))
  const totalValor = grupos.reduce((acc, g) => acc + g.totalValor, 0)

  const subtituloLocal = rotuloLocal
    ? `LOCAL: ${rotuloLocal.toUpperCase()}`
    : undefined

  return (
    <>
      <RelatorioCabecalhoPegaPlantao
        nomeEmpresa={nomeEmpresa}
        titulo="Pagamentos para Plantões"
        dataGeracao={dataGeracao}
        periodoInicio={dataInicio}
        periodoFim={dataFim}
        subtituloLocal={subtituloLocal}
        subtituloExtra="Mostrando período entre"
      />

      {isLoading ? (
        <div className="h-40 animate-pulse rounded bg-gray-100" />
      ) : grupos.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">
          Nenhum plantão encontrado para os filtros selecionados.
        </p>
      ) : (
        <div className="space-y-4">
          {grupos.map((grupo) => {
            const rotuloProf =
              grupo.registroConselho.trim().length > 0
                ? `${grupo.profissionalNome} - ${grupo.registroConselho}`
                : grupo.profissionalNome

            return (
              <section key={grupo.profissionalId} className="break-inside-avoid">
                <p className="mb-1 text-[10px] font-bold text-gray-900">{rotuloProf}</p>
                <RelatorioTabelaPega>
                  <thead>
                    <tr>
                      <ThPega>Data</ThPega>
                      <ThPega>Setor</ThPega>
                      <ThPega>Tipo</ThPega>
                      <ThPega>Duração (h)</ThPega>
                      <ThPega>Valor</ThPega>
                    </tr>
                  </thead>
                  <tbody>
                    {grupo.linhas.map((l, idx) => (
                      <tr key={`${grupo.profissionalId}-${idx}`}>
                        <TdPega className="whitespace-nowrap">
                          {fmtDataPlantaoHora(l.dataPlantao, l.horaInicio)}
                        </TdPega>
                        <TdPega>{l.setorLabel}</TdPega>
                        <TdPega>{l.tipo}</TdPega>
                        <TdPega className="text-center">{l.duracao}</TdPega>
                        <TdPega className="text-right whitespace-nowrap">
                          {fmtBRLPega(l.valor)}
                        </TdPega>
                      </tr>
                    ))}
                    <tr className="font-bold">
                      <TdPega colSpan={3}>Total</TdPega>
                      <TdPega className="text-center">
                        {grupo.totalPlantoes} Plantão{grupo.totalPlantoes !== 1 ? 'ões' : ''}
                      </TdPega>
                      <TdPega className="text-right">
                        <div>{grupo.totalDuracao}</div>
                        <div>{fmtBRLPega(grupo.totalValor)}</div>
                      </TdPega>
                    </tr>
                  </tbody>
                </RelatorioTabelaPega>
              </section>
            )
          })}
        </div>
      )}

      <RelatorioRodapeTotais>
        <RelatorioTabelaPega>
          <tbody>
            <tr>
              <TdPega className="font-bold">Plantões</TdPega>
              <TdPega className="font-bold">Duração (h)</TdPega>
              <TdPega className="font-bold">Valor</TdPega>
            </tr>
            <tr>
              <TdPega>Total Geral</TdPega>
              <TdPega>
                {totalPlantoes} &nbsp; {totalDuracao}
              </TdPega>
              <TdPega className="text-right">{fmtBRLPega(totalValor)}</TdPega>
            </tr>
          </tbody>
        </RelatorioTabelaPega>
      </RelatorioRodapeTotais>
    </>
  )
}
