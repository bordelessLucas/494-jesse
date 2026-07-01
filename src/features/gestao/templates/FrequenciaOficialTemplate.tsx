import { BlocoAssinaturaDigitalJuridica } from '../../relatorios/components/BlocoAssinaturaDigitalJuridica'
import { CabecalhoContratual } from '../../relatorios/components/CabecalhoContratual'
import { PaginaA4 } from '../../relatorios/components/PaginaA4'
import type {
  AssinaturaResponsavel,
  CabecalhoContratualData,
} from '../../relatorios/types'
import type { DadosFrequenciaConsolidados } from '../../../lib/gestao/buscarDadosFrequencia'

type FrequenciaOficialTemplateProps = {
  cabecalho: CabecalhoContratualData
  titulo: string
  periodoRotulo: string
  dados: DadosFrequenciaConsolidados
  carregando?: boolean
  assinatura?: AssinaturaResponsavel
  modoPreviewAssinatura?: boolean
}

const th = 'border border-black p-1 text-center text-[9px] font-bold uppercase text-black'
const td = 'border border-black px-1 py-0.5 text-[9px] text-black align-top'

export function FrequenciaOficialTemplate({
  cabecalho,
  titulo,
  periodoRotulo,
  dados,
  carregando = false,
  assinatura,
  modoPreviewAssinatura = true,
}: FrequenciaOficialTemplateProps) {
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

      <h2 className="mt-4 text-center text-sm font-bold uppercase tracking-wide text-black">
        {titulo}
      </h2>

      <p className="mt-2 text-center text-[10px] text-black">
        Profissional: <strong>{dados.profissionalNome}</strong> · {dados.profissionalConselho}
      </p>
      <p className="text-center text-[10px] text-black">Período: {periodoRotulo}</p>

      <table className="mt-3 w-full border-collapse text-black">
        <thead>
          <tr>
            <th className={`${th} w-[9%]`}>Data</th>
            <th className={`${th} w-[8%]`}>Ent. prev.</th>
            <th className={`${th} w-[8%]`}>Saída prev.</th>
            <th className={`${th} w-[8%]`}>Ent. real</th>
            <th className={`${th} w-[8%]`}>Saída real</th>
            <th className={`${th} w-[14%]`}>Setor</th>
            <th className={`${th} w-[7%]`}>Falta</th>
            <th className={`${th} w-[18%]`}>Justificativa</th>
            <th className={`${th} w-[8%]`}>Horas</th>
            <th className={`${th} w-[12%]`}>Assinatura</th>
          </tr>
        </thead>
        <tbody>
          {carregando ? (
            <tr>
              <td colSpan={10} className={`${td} p-4 text-center`}>
                A carregar registos…
              </td>
            </tr>
          ) : dados.linhas.length === 0 ? (
            <tr>
              <td colSpan={10} className={`${td} p-4 text-center`}>
                Nenhum plantão encontrado no período seleccionado.
              </td>
            </tr>
          ) : (
            dados.linhas.map((linha) => (
              <tr key={linha.plantaoId} className="break-inside-avoid">
                <td className={`${td} text-center`}>{linha.data}</td>
                <td className={`${td} text-center`}>{linha.horaPrevistaEntrada}</td>
                <td className={`${td} text-center`}>{linha.horaPrevistaSaida}</td>
                <td className={`${td} text-center`}>{linha.horaRealEntrada ?? '—'}</td>
                <td className={`${td} text-center`}>{linha.horaRealSaida ?? '—'}</td>
                <td className={td}>{linha.setor}</td>
                <td className={`${td} text-center font-semibold`}>
                  {linha.falta ? 'SIM' : 'NÃO'}
                </td>
                <td className={td}>{linha.justificativa ?? '—'}</td>
                <td className={`${td} text-center`}>
                  {linha.horasValidadas.toLocaleString('pt-PT', {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })}
                </td>
                <td className={`${td} text-center text-[8px]`}>
                  {linha.assinaturaEntrada}
                  {linha.assinaturaSaida !== linha.assinaturaEntrada
                    ? ` / ${linha.assinaturaSaida}`
                    : ''}
                </td>
              </tr>
            ))
          )}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={8} className={`${td} text-right font-bold`}>
              Total de horas validadas
            </td>
            <td className={`${td} text-center font-bold`}>
              {dados.totalHorasValidadas.toLocaleString('pt-PT', {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })}
            </td>
            <td className={`${td} text-center font-bold`}>
              Faltas: {dados.totalFaltas}
            </td>
          </tr>
        </tfoot>
      </table>
    </PaginaA4>
  )
}
