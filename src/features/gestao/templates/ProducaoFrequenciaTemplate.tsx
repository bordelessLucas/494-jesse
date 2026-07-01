import { BlocoAssinaturaDigitalJuridica } from '../../relatorios/components/BlocoAssinaturaDigitalJuridica'
import { CabecalhoContratual } from '../../relatorios/components/CabecalhoContratual'
import { PaginaA4 } from '../../relatorios/components/PaginaA4'
import type {
  AssinaturaResponsavel,
  CabecalhoContratualData,
} from '../../relatorios/types'
import type { ProducaoFrequenciaLinha } from '../../../lib/gestao/buscarDadosFrequencia'

type ProducaoFrequenciaTemplateProps = {
  cabecalho: CabecalhoContratualData
  competenciaRotulo: string
  linhas: ProducaoFrequenciaLinha[]
  carregando?: boolean
  assinatura?: AssinaturaResponsavel
  modoPreviewAssinatura?: boolean
}

const th = 'border border-black p-1.5 text-center text-[10px] font-bold uppercase text-black'
const td = 'border border-black px-2 py-1 text-[10px] text-black align-middle'

export function ProducaoFrequenciaTemplate({
  cabecalho,
  competenciaRotulo,
  linhas,
  carregando = false,
  assinatura,
  modoPreviewAssinatura = true,
}: ProducaoFrequenciaTemplateProps) {
  const totalHoras = linhas.reduce((acc, l) => acc + l.totalHorasValidadas, 0)
  const totalFaltas = linhas.reduce((acc, l) => acc + l.totalFaltas, 0)

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
        Produção de Frequência — Consolidado Mensal
      </h2>
      <p className="mt-2 text-center text-[10px] text-black">
        Competência {competenciaRotulo} · Horas validadas prontas para assinatura jurídica
      </p>

      <table className="mt-4 w-full border-collapse text-black">
        <thead>
          <tr>
            <th className={`${th} w-[32%] text-left`}>Profissional</th>
            <th className={`${th} w-[18%] text-left`}>Conselho</th>
            <th className={`${th} w-[12%]`}>Plantões</th>
            <th className={`${th} w-[12%]`}>Horas validadas</th>
            <th className={`${th} w-[10%]`}>Faltas</th>
            <th className={`${th} w-[16%]`}>Assinatura</th>
          </tr>
        </thead>
        <tbody>
          {carregando ? (
            <tr>
              <td colSpan={6} className={`${td} p-6 text-center`}>
                A consolidar profissionais…
              </td>
            </tr>
          ) : linhas.length === 0 ? (
            <tr>
              <td colSpan={6} className={`${td} p-6 text-center`}>
                Nenhum registo de frequência na competência seleccionada.
              </td>
            </tr>
          ) : (
            linhas.map((linha) => (
              <tr key={linha.profissionalId} className="break-inside-avoid">
                <td className={td}>{linha.profissionalNome}</td>
                <td className={td}>{linha.profissionalConselho}</td>
                <td className={`${td} text-center`}>{linha.totalRegistros}</td>
                <td className={`${td} text-center font-semibold`}>
                  {linha.totalHorasValidadas.toLocaleString('pt-PT', {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })}
                </td>
                <td className={`${td} text-center`}>{linha.totalFaltas}</td>
                <td className={`${td} text-center text-[9px]`}>Pendente</td>
              </tr>
            ))
          )}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3} className={`${td} text-right font-bold`}>
              Totais ({linhas.length} profissionais)
            </td>
            <td className={`${td} text-center font-bold`}>
              {totalHoras.toLocaleString('pt-PT', {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })}
            </td>
            <td className={`${td} text-center font-bold`}>{totalFaltas}</td>
            <td className={td} />
          </tr>
        </tfoot>
      </table>
    </PaginaA4>
  )
}
