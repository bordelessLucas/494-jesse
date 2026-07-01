import { BlocoAssinaturaDigitalJuridica } from '../../relatorios/components/BlocoAssinaturaDigitalJuridica'
import { CabecalhoContratual } from '../../relatorios/components/CabecalhoContratual'
import { PaginaA4 } from '../../relatorios/components/PaginaA4'
import type {
  AssinaturaResponsavel,
  CabecalhoContratualData,
  IndicadoresScirasEscala,
  RelatorioAtividadesBloco,
} from '../../relatorios/types'
import type { IndicadorUti } from '../../sciras/types'

type RelatorioAtividadesUtiTemplateProps = {
  cabecalho: CabecalhoContratualData
  tituloRelatorio: string
  dataEmissao: string
  conteudo: RelatorioAtividadesBloco[]
  competenciaRotulo: string
  indicadorUti: IndicadorUti | null
  indicadoresEscala?: IndicadoresScirasEscala | null
  indicadoresCarregando?: boolean
  assinatura: AssinaturaResponsavel
  modoPreviewAssinatura?: boolean
}

const tabelaClasse = 'bloco-impressao w-full border-collapse border border-black text-left text-xs'
const celulaEtiqueta = 'border border-black px-2 py-1 align-top text-black font-semibold w-[44%]'
const celulaValor = 'border border-black px-2 py-1 align-top text-black'

function fmtPercentual(valor: number): string {
  return `${valor.toLocaleString('pt-PT', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} %`
}

function fmtDecimal(valor: number): string {
  return valor.toLocaleString('pt-PT', { minimumFractionDigits: 0, maximumFractionDigits: 4 })
}

function fmtInteiro(valor: number): string {
  return valor.toLocaleString('pt-PT', { maximumFractionDigits: 0 })
}

function fmtHoras(valor: number): string {
  return valor.toLocaleString('pt-PT', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

function BlocoConteudo({ bloco }: { bloco: RelatorioAtividadesBloco }) {
  if (bloco.type === 'text') {
    return <p className="bloco-impressao text-justify text-sm leading-relaxed">{bloco.content}</p>
  }
  if (!bloco.url?.trim()) {
    return (
      <p className="bloco-impressao text-center text-xs italic text-black">
        [Imagem pendente]
      </p>
    )
  }
  return (
    <figure className="bloco-impressao my-2 text-center">
      <img
        src={bloco.url}
        alt={bloco.caption ?? 'Imagem do relatório'}
        className="mx-auto block max-h-[300px] w-auto border border-black object-contain"
      />
      {bloco.caption ? (
        <figcaption className="mt-2 text-xs italic text-black">{bloco.caption}</figcaption>
      ) : null}
    </figure>
  )
}

export function RelatorioAtividadesUtiTemplate({
  cabecalho,
  tituloRelatorio,
  dataEmissao,
  conteudo,
  competenciaRotulo,
  indicadorUti,
  indicadoresEscala = null,
  indicadoresCarregando = false,
  assinatura,
  modoPreviewAssinatura = true,
}: RelatorioAtividadesUtiTemplateProps) {
  return (
    <PaginaA4
      rodape={
        <BlocoAssinaturaDigitalJuridica
          assinatura={assinatura}
          modoPreview={modoPreviewAssinatura}
        />
      }
    >
      <CabecalhoContratual {...cabecalho} />
      <p className="mt-4 text-right text-sm text-black">{dataEmissao}</p>
      <h2 className="mt-6 text-center text-sm font-bold uppercase tracking-wide text-black">
        {tituloRelatorio}
      </h2>

      <section className="mt-6 space-y-4 text-black">
        {conteudo.map((bloco) => (
          <BlocoConteudo key={bloco.clientKey} bloco={bloco} />
        ))}
      </section>

      <section className="bloco-impressao mt-8 space-y-3">
        <header>
          <h3 className="text-center text-sm font-bold uppercase tracking-wide text-black">
            Indicadores da escala realizada
          </h3>
          <p className="mt-1 text-center text-xs text-black">
            Competência {competenciaRotulo}
            {indicadoresCarregando ? ' — A calcular…' : ' — plantões com status «realizado»'}
          </p>
        </header>
        <table className={tabelaClasse}>
          <tbody>
            <tr>
              <td className={celulaEtiqueta}>Total de horas médicas na UTI</td>
              <td className={celulaValor}>
                {indicadoresCarregando
                  ? '…'
                  : indicadoresEscala
                    ? `${fmtHoras(indicadoresEscala.totalHorasMedicasUti)} h`
                    : '—'}
              </td>
            </tr>
            <tr>
              <td className={celulaEtiqueta}>Plantões realizados (total)</td>
              <td className={celulaValor}>
                {indicadoresCarregando
                  ? '…'
                  : indicadoresEscala
                    ? fmtInteiro(indicadoresEscala.totalPlantoesRealizados)
                    : '—'}
              </td>
            </tr>
            <tr>
              <td className={celulaEtiqueta}>Plantões realizados na UTI</td>
              <td className={celulaValor}>
                {indicadoresCarregando
                  ? '…'
                  : indicadoresEscala
                    ? fmtInteiro(indicadoresEscala.totalPlantoesRealizadosUti)
                    : '—'}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="bloco-impressao mt-8 space-y-3">
        <header>
          <h3 className="text-center text-sm font-bold uppercase tracking-wide text-black">
            Indicadores UTI — busca activa
          </h3>
          <p className="mt-1 text-center text-xs text-black">
            Competência {competenciaRotulo}
            {indicadoresCarregando ? ' — A carregar dados…' : null}
          </p>
        </header>
        <table className={tabelaClasse}>
          <thead>
            <tr>
              <th className={`${celulaEtiqueta} bg-white`}>Indicador</th>
              <th className={`${celulaValor} bg-white`}>Valor</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={celulaEtiqueta}>Setor</td>
              <td className={celulaValor}>
                {indicadoresCarregando ? '…' : indicadorUti?.setor ?? '—'}
              </td>
            </tr>
            <tr>
              <td className={celulaEtiqueta}>Pacientes / dia (média)</td>
              <td className={celulaValor}>
                {indicadoresCarregando
                  ? '…'
                  : indicadorUti
                    ? fmtDecimal(indicadorUti.totalPacientesDia)
                    : '—'}
              </td>
            </tr>
            <tr>
              <td className={celulaEtiqueta}>Usuários acompanhados (busca activa)</td>
              <td className={celulaValor}>
                {indicadoresCarregando
                  ? '…'
                  : indicadorUti
                    ? fmtInteiro(indicadorUti.usuariosAcompanhadosBuscaAtiva)
                    : '—'}
              </td>
            </tr>
            <tr>
              <td className={celulaEtiqueta}>Taxa de busca activa</td>
              <td className={celulaValor}>
                {indicadoresCarregando
                  ? '…'
                  : indicadorUti
                    ? fmtPercentual(indicadorUti.taxaBuscaAtiva)
                    : '—'}
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </PaginaA4>
  )
}
