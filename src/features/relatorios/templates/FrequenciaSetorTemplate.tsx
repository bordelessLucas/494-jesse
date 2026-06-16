import { BlocoAssinaturaDigitalJuridica } from '../components/BlocoAssinaturaDigitalJuridica'
import { CabecalhoContratual } from '../components/CabecalhoContratual'
import { PaginaA4 } from '../components/PaginaA4'
import {
  DEFAULT_TOTAL_DIAS_MES,
  type AssinaturaResponsavel,
  type CabecalhoContratualData,
  type EscalaFrequenciaSetorEntrada,
  type TurnoFrequencia,
} from '../types'

type FrequenciaSetorTemplateProps = {
  cabecalho: CabecalhoContratualData
  /** Turnos exibidos como colunas, na ordem desejada (ex.: ['07-13H', '13-19H', '19-07H']). */
  turnos: TurnoFrequencia[]
  /** Lançamentos da escala. Posições sem entrada ficam em branco para assinatura manual. */
  escala: EscalaFrequenciaSetorEntrada[]
  /** Total de dias do mês de referência. Default: 31. */
  totalDias?: number
  assinatura?: AssinaturaResponsavel
  modoPreviewAssinatura?: boolean
}

type MatrizEscala = Record<number, Record<TurnoFrequencia, string | null>>

/**
 * Template 1 — Lista de Frequência por Setor (ex.: UTI Pediátrica).
 *
 * Renderiza o cabeçalho institucional e uma grade compacta com:
 *   - Coluna fixa "DIA" (01 a {totalDias})
 *   - Uma coluna por turno informado
 *   - Em cada célula: nome do profissional escalado ou espaço para
 *     assinatura manual (célula vazia com altura mínima).
 */
export function FrequenciaSetorTemplate({
  cabecalho,
  turnos,
  escala,
  totalDias = DEFAULT_TOTAL_DIAS_MES,
  assinatura,
  modoPreviewAssinatura = true,
}: FrequenciaSetorTemplateProps) {
  const matriz = construirMatrizDeEscala(escala, turnos, totalDias)
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
        Lista de Frequência — {cabecalho.servico}
      </h2>

      <table className="mt-3 w-full table-fixed border-collapse text-[10px] leading-tight">
        <thead>
          <tr>
            <th className="w-[10%] border border-black p-1 text-center font-bold uppercase">
              Dia
            </th>
            {turnos.map((turno) => (
              <th
                key={turno}
                className="border border-black p-1 text-center font-bold uppercase"
              >
                {turno}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dias.map((dia) => (
            <tr key={dia} className="break-inside-avoid">
              <td className="border border-black p-1 text-center align-middle font-semibold">
                {String(dia).padStart(2, '0')}
              </td>
              {turnos.map((turno) => (
                <CelulaProfissional
                  key={turno}
                  profissionalNome={matriz[dia]?.[turno] ?? null}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </PaginaA4>
  )
}

type CelulaProfissionalProps = {
  profissionalNome: string | null
}

function CelulaProfissional({ profissionalNome }: CelulaProfissionalProps) {
  return (
    <td className="h-7 border border-black px-1 pb-0.5 align-bottom">
      {profissionalNome ? (
        <span className="block truncate">{profissionalNome}</span>
      ) : (
        <span aria-hidden className="block h-full" />
      )}
    </td>
  )
}

/**
 * Converte a lista achatada de lançamentos em uma matriz `dia → turno → nome`,
 * preenchendo posições vazias com `null` para facilitar a renderização.
 *
 * Entradas com `dia` fora do intervalo ou `turno` não declarado nas colunas
 * são silenciosamente ignoradas, garantindo robustez à camada de UI.
 */
function construirMatrizDeEscala(
  escala: EscalaFrequenciaSetorEntrada[],
  turnos: TurnoFrequencia[],
  totalDias: number,
): MatrizEscala {
  const matriz: MatrizEscala = {}
  for (let dia = 1; dia <= totalDias; dia += 1) {
    matriz[dia] = Object.fromEntries(turnos.map((turno) => [turno, null]))
  }

  for (const entrada of escala) {
    const diaInvalido = entrada.dia < 1 || entrada.dia > totalDias
    if (diaInvalido) continue
    if (!turnos.includes(entrada.turno)) continue
    matriz[entrada.dia][entrada.turno] = entrada.profissionalNome
  }

  return matriz
}
