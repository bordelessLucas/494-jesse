import { BlocoAssinaturaDigitalJuridica } from '../components/BlocoAssinaturaDigitalJuridica'
import { CabecalhoContratual } from '../components/CabecalhoContratual'
import { PaginaA4 } from '../components/PaginaA4'
import {
  DEFAULT_TOTAL_DIAS_MES,
  type AssinaturaResponsavel,
  type CabecalhoContratualData,
  type EscalaCoordenacaoEntrada,
} from '../types'

type FrequenciaCoordenacaoTemplateProps = {
  cabecalho: CabecalhoContratualData
  /** Lançamentos por dia. Posições ausentes ficam em branco para assinatura manual. */
  escala: EscalaCoordenacaoEntrada[]
  /** Total de dias do mês de referência. Default: 31. */
  totalDias?: number
  assinatura?: AssinaturaResponsavel
  modoPreviewAssinatura?: boolean
}

/**
 * Template 2 — Lista de Frequência da Coordenação (ex.: SCIH).
 *
 * Reaproveita o cabeçalho institucional e renderiza uma tabela mais simples:
 * coluna "DIA" e uma coluna larga "Assinatura / Nome" para registro manual.
 */
export function FrequenciaCoordenacaoTemplate({
  cabecalho,
  escala,
  totalDias = DEFAULT_TOTAL_DIAS_MES,
  assinatura,
  modoPreviewAssinatura = true,
}: FrequenciaCoordenacaoTemplateProps) {
  const coordenadorPorDia = indexarPorDia(escala, totalDias)
  const dias = Array.from({ length: totalDias }, (_, index) => index + 1)

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
        Lista de Frequência — Coordenação {cabecalho.servico}
      </h2>

      <table className="mt-3 w-full table-fixed border-collapse text-[11px] leading-tight">
        <thead>
          <tr>
            <th className="w-[15%] border border-black p-2 text-center font-bold uppercase">
              Dia
            </th>
            <th className="border border-black p-2 text-center font-bold uppercase">
              Assinatura / Nome
            </th>
          </tr>
        </thead>
        <tbody>
          {dias.map((dia) => (
            <tr key={dia} className="break-inside-avoid">
              <td className="border border-black p-1 text-center align-middle font-semibold">
                {String(dia).padStart(2, '0')}
              </td>
              <td className="h-8 border border-black px-2 pb-1 align-bottom">
                {coordenadorPorDia.get(dia) ?? (
                  <span aria-hidden className="block h-full" />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </PaginaA4>
  )
}

function indexarPorDia(
  escala: EscalaCoordenacaoEntrada[],
  totalDias: number,
): Map<number, string | null> {
  const mapa = new Map<number, string | null>()
  for (const entrada of escala) {
    const diaInvalido = entrada.dia < 1 || entrada.dia > totalDias
    if (diaInvalido) continue
    mapa.set(entrada.dia, entrada.coordenadorNome)
  }
  return mapa
}
