import { BlocoAssinaturaDigitalJuridica } from '../components/BlocoAssinaturaDigitalJuridica'
import { CabecalhoContratual } from '../components/CabecalhoContratual'
import { PaginaA4 } from '../components/PaginaA4'
import type {
  AssinaturaResponsavel,
  CabecalhoContratualData,
  LinhaFrequenciaDetalhada,
} from '../types'

type FrequenciaListaDetalhadaTemplateProps = {
  cabecalho: CabecalhoContratualData
  titulo: string
  linhas: LinhaFrequenciaDetalhada[]
  carregando?: boolean
  totalPlantoes?: number
  assinatura?: AssinaturaResponsavel
  modoPreviewAssinatura?: boolean
}

/**
 * Lista de frequência tabular com dados reais da escala:
 * Profissional, CRM, Data, Entrada, Saída, Setor.
 */
export function FrequenciaListaDetalhadaTemplate({
  cabecalho,
  titulo,
  linhas,
  carregando = false,
  totalPlantoes = 0,
  assinatura,
  modoPreviewAssinatura = true,
}: FrequenciaListaDetalhadaTemplateProps) {
  return (
    <PaginaA4
      rodape={
        assinatura ? (
          <BlocoAssinaturaDigitalJuridica
            assinatura={assinatura}
            modoPreview={modoPreviewAssinatura}
          />
        ) : undefined
      }
    >
      <CabecalhoContratual {...cabecalho} />

      <h2 className="mt-4 text-center text-sm font-bold uppercase tracking-wide">
        {titulo}
      </h2>

      <p className="mt-2 text-center text-[10px] text-slate-600">
        {carregando
          ? 'A carregar plantões realizados…'
          : `${linhas.length} registo(s) · ${totalPlantoes} plantão(ões) realizados na competência`}
      </p>

      <table className="mt-3 w-full table-fixed border-collapse text-[9px] leading-tight">
        <thead>
          <tr>
            <th className="w-[22%] border border-black p-1 text-left font-bold uppercase">
              Profissional
            </th>
            <th className="w-[14%] border border-black p-1 text-left font-bold uppercase">
              CRM / Conselho
            </th>
            <th className="w-[10%] border border-black p-1 text-center font-bold uppercase">
              Data
            </th>
            <th className="w-[8%] border border-black p-1 text-center font-bold uppercase">
              Entrada
            </th>
            <th className="w-[8%] border border-black p-1 text-center font-bold uppercase">
              Saída
            </th>
            <th className="border border-black p-1 text-left font-bold uppercase">
              Setor
            </th>
          </tr>
        </thead>
        <tbody>
          {linhas.length === 0 && !carregando ? (
            <tr>
              <td
                colSpan={6}
                className="border border-black p-4 text-center text-slate-500"
              >
                Nenhum plantão com status «realizado» nesta competência e local.
              </td>
            </tr>
          ) : (
            linhas.map((linha, idx) => (
              <tr key={`${linha.data}-${linha.profissionalNome}-${idx}`} className="break-inside-avoid">
                <td className="border border-black px-1 py-0.5 align-top">
                  {linha.profissionalNome}
                </td>
                <td className="border border-black px-1 py-0.5 align-top">{linha.crm}</td>
                <td className="border border-black px-1 py-0.5 text-center align-top">
                  {linha.data}
                </td>
                <td className="border border-black px-1 py-0.5 text-center align-top">
                  {linha.horaEntrada}
                </td>
                <td className="border border-black px-1 py-0.5 text-center align-top">
                  {linha.horaSaida}
                </td>
                <td className="border border-black px-1 py-0.5 align-top">{linha.setor}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </PaginaA4>
  )
}
