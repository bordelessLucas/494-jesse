import { BrandedLogoOrInitial } from '../../../components/branding/BrandedLogoOrInitial'
import {
  fmtBRL,
  fmtPeriodo,
  totaisPagamentos,
  type LinhaPagamentoProfissional,
} from '../relatoriosMockData'

type RelatorioPagamentosFolhaProps = {
  linhas: LinhaPagamentoProfissional[]
  dataInicio: string
  dataFim: string
  dataGeracao: string
  nomeEmpresa: string
  selecionados: Set<string>
  onAlternarSelecao: (id: string) => void
  listarTelefone: boolean
}

export function RelatorioPagamentosFolha({
  linhas,
  dataInicio,
  dataFim,
  dataGeracao,
  nomeEmpresa,
  selecionados,
  onAlternarSelecao,
  listarTelefone,
}: RelatorioPagamentosFolhaProps) {
  const totais = totaisPagamentos(linhas)

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
                Pagamentos para Plantões
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

      <table className="w-full border-collapse text-xs text-black">
        <thead>
          <tr className="border-b border-gray-400">
            <th
              scope="col"
              className="no-print w-8 border border-gray-300 px-1 py-1 text-center font-bold"
            >
              sim
            </th>
            <th scope="col" className="border border-gray-300 px-2 py-1 text-left font-bold">
              Total Geral
            </th>
            {listarTelefone ? (
              <th scope="col" className="border border-gray-300 px-2 py-1 text-left font-bold">
                Telefone
              </th>
            ) : null}
            <th scope="col" className="border border-gray-300 px-2 py-1 text-center font-bold">
              Plantões
            </th>
            <th scope="col" className="border border-gray-300 px-2 py-1 text-center font-bold">
              Duração (h)
            </th>
            <th scope="col" className="border border-gray-300 px-2 py-1 text-right font-bold">
              Valor (R$)
            </th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((linha) => (
            <tr key={linha.id} className="border-b border-gray-200">
              <td className="no-print border border-gray-300 px-1 py-1 text-center align-middle">
                <input
                  type="checkbox"
                  checked={selecionados.has(linha.id)}
                  onChange={() => onAlternarSelecao(linha.id)}
                  className="h-3 w-3 print:pointer-events-none"
                  aria-label={`Selecionar ${linha.profissionalNome}`}
                />
              </td>
              <td className="border border-gray-300 px-2 py-1 align-middle font-medium">
                {linha.profissionalNome}
              </td>
              {listarTelefone ? (
                <td className="border border-gray-300 px-2 py-1 align-middle tabular-nums text-gray-700">
                  {linha.telefone || '—'}
                </td>
              ) : null}
              <td className="border border-gray-300 px-2 py-1 text-center align-middle tabular-nums">
                {linha.plantoes}
              </td>
              <td className="border border-gray-300 px-2 py-1 text-center align-middle tabular-nums">
                {linha.duracaoHoras}
              </td>
              <td className="border border-gray-300 px-2 py-1 text-right align-middle tabular-nums">
                {fmtBRL(linha.valor)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-bold">
            <td className="no-print border border-gray-400 px-1 py-1.5" />
            <td
              colSpan={listarTelefone ? 2 : 1}
              className="border border-gray-400 px-2 py-1.5 text-right uppercase"
            >
              Total geral
            </td>
            <td className="border border-gray-400 px-2 py-1.5 text-center tabular-nums">
              {totais.plantoes}
            </td>
            <td className="border border-gray-400 px-2 py-1.5 text-center tabular-nums">
              {totais.horas}
            </td>
            <td className="border border-gray-400 px-2 py-1.5 text-right tabular-nums">
              {fmtBRL(totais.valor)}
            </td>
          </tr>
        </tfoot>
      </table>
    </>
  )
}
