import { BlocoAssinaturaDigitalJuridica } from '../components/BlocoAssinaturaDigitalJuridica'
import { CabecalhoContratual } from '../components/CabecalhoContratual'
import { PaginaA4 } from '../components/PaginaA4'
import type {
  AssinaturaResponsavel,
  CabecalhoContratualData,
  IndicadoresScirasEscala,
  RelatorioAtividadesBloco,
} from '../types'
import type { IndicadorCirurgico, IndicadorUti } from '../../sciras/types'

type RelatorioAtividadesTemplateProps = {
  cabecalho: CabecalhoContratualData
  /** Local + data já formatados, ex.: "São Paulo, 12 de maio de 2026". */
  dataEmissao: string
  /** Blocos digitados pelo coordenador no formulário do sistema. */
  conteudo: RelatorioAtividadesBloco[]
  /** Rótulo da competência no relatório (ex.: cabeçalho MAIO/2026). */
  competenciaRotulo: string
  /** Indicadores UTI guardados para o período; `null` se inexistente. */
  indicadorUti: IndicadorUti | null
  /** Indicadores cirúrgicos guardados para o período; `null` se inexistente. */
  indicadorCirurgico: IndicadorCirurgico | null
  /** Métricas calculadas a partir dos plantões realizados na escala. */
  indicadoresEscala?: IndicadoresScirasEscala | null
  /** Quando verdadeiro, os dados ainda estão a ser obtidos do servidor. */
  indicadoresCarregando?: boolean
  assinatura: AssinaturaResponsavel
  modoPreviewAssinatura?: boolean
}

const TITULO_RELATORIO =
  'RELATÓRIO DE ATIVIDADES DESENVOLVIDAS — MÉDICO COORDENADOR SCIRAS'

/**
 * Template 3 — Relatório descritivo do coordenador SCIRAS.
 *
 * Layout:
 *   1. Cabeçalho institucional contratual
 *   2. Local + data alinhados à direita
 *   3. Título centralizado em caixa alta
 *   4. Corpo justificado com parágrafos e listas bulletadas
 *   5. Rodapé com bloco central de assinatura e área lateral reservada
 *      para a validação futura de Assinatura Digital gov.br
 */
export function RelatorioAtividadesTemplate({
  cabecalho,
  dataEmissao,
  conteudo,
  competenciaRotulo,
  indicadorUti,
  indicadorCirurgico,
  indicadoresEscala = null,
  indicadoresCarregando = false,
  assinatura,
  modoPreviewAssinatura = true,
}: RelatorioAtividadesTemplateProps) {
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

      <p className="mt-4 text-right text-sm">{dataEmissao}</p>

      <h2 className="mt-6 text-center text-sm font-bold uppercase tracking-wide">
        {TITULO_RELATORIO}
      </h2>

      <section className="mt-6 space-y-4 text-justify text-sm leading-relaxed">
        {conteudo.map((bloco) => (
          <BlocoConteudoRelatorio key={bloco.clientKey} bloco={bloco} />
        ))}
      </section>

      <SecaoIndicadoresEscala
        competenciaRotulo={competenciaRotulo}
        indicadores={indicadoresEscala}
        carregando={indicadoresCarregando}
      />

      <SecaoIndicadoresPeriodo
        competenciaRotulo={competenciaRotulo}
        indicadorUti={indicadorUti}
        indicadorCirurgico={indicadorCirurgico}
        carregando={indicadoresCarregando}
      />

    </PaginaA4>
  )
}

type BlocoConteudoRelatorioProps = {
  bloco: RelatorioAtividadesBloco
}

function BlocoConteudoRelatorio({ bloco }: BlocoConteudoRelatorioProps) {
  if (bloco.type === 'text') {
    return <p className="bloco-impressao text-justify">{bloco.content}</p>
  }

  if (!bloco.url?.trim()) {
    return (
      <p className="bloco-impressao text-center text-xs italic text-slate-500">
        [Imagem pendente — adicione ficheiro ou URL no editor]
      </p>
    )
  }

  return <BlocoImagemRelatorio url={bloco.url} caption={bloco.caption} />
}

type BlocoImagemRelatorioProps = {
  url: string
  caption?: string
}

/**
 * Bloco de imagem do relatório.
 *
 * Restrições visuais:
 *   - Centralizado horizontalmente.
 *   - Borda sutil cinza para destacar do fundo branco da folha.
 *   - `max-h-[300px]` + `object-contain` impedem que uma imagem grande
 *     quebre o layout A4 ou estoure a página em impressão.
 *   - `bloco-impressao` (regra global) evita que a figura seja partida
 *     entre páginas durante a impressão.
 */
function BlocoImagemRelatorio({ url, caption }: BlocoImagemRelatorioProps) {
  const textoAlternativo = caption ?? 'Imagem ilustrativa do relatório'
  return (
    <figure className="bloco-impressao my-2 text-center">
      <img
        src={url}
        alt={textoAlternativo}
        className="mx-auto block max-h-[300px] w-auto border border-slate-300 object-contain"
      />
      {caption ? (
        <figcaption className="mt-2 text-xs italic text-slate-600">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  )
}

type SecaoIndicadoresPeriodoProps = {
  competenciaRotulo: string
  indicadorUti: IndicadorUti | null
  indicadorCirurgico: IndicadorCirurgico | null
  carregando: boolean
}

function fmtPercentualRelatorio(valor: number): string {
  return `${valor.toLocaleString('pt-PT', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} %`
}

function fmtDecimalRelatorio(valor: number): string {
  return valor.toLocaleString('pt-PT', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  })
}

function fmtInteiroRelatorio(valor: number): string {
  return valor.toLocaleString('pt-PT', { maximumFractionDigits: 0 })
}

const tabelaIndicadoresClasse =
  'bloco-impressao w-full border-collapse border-2 border-black text-left text-xs'

const celulaIndicadoresClasse = 'border border-black px-2 py-1 align-top text-black'
const celulaEtiquetaClasse = `${celulaIndicadoresClasse} w-[44%] font-semibold`
const celulaValorClasse = celulaIndicadoresClasse

function fmtHorasRelatorio(valor: number): string {
  return valor.toLocaleString('pt-PT', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
}

type SecaoIndicadoresEscalaProps = {
  competenciaRotulo: string
  indicadores: IndicadoresScirasEscala | null
  carregando: boolean
}

function SecaoIndicadoresEscala({
  competenciaRotulo,
  indicadores,
  carregando,
}: SecaoIndicadoresEscalaProps) {
  return (
    <section className="bloco-impressao mt-8 space-y-3">
      <header>
        <h3 className="text-center text-sm font-bold uppercase tracking-wide text-black">
          Indicadores da escala realizada
        </h3>
        <p className="mt-1 text-center text-xs text-black">
          Competência {competenciaRotulo}
          {carregando ? ' — A calcular…' : ' — plantões com status «realizado»'}
        </p>
      </header>

      <table className={tabelaIndicadoresClasse}>
        <tbody>
          <tr>
            <td className={celulaEtiquetaClasse}>Total de horas médicas na UTI</td>
            <td className={celulaValorClasse}>
              {carregando
                ? '…'
                : indicadores
                  ? `${fmtHorasRelatorio(indicadores.totalHorasMedicasUti)} h`
                  : '—'}
            </td>
          </tr>
          <tr>
            <td className={celulaEtiquetaClasse}>Plantões realizados (total)</td>
            <td className={celulaValorClasse}>
              {carregando
                ? '…'
                : indicadores
                  ? fmtInteiroRelatorio(indicadores.totalPlantoesRealizados)
                  : '—'}
            </td>
          </tr>
          <tr>
            <td className={celulaEtiquetaClasse}>Plantões realizados na UTI</td>
            <td className={celulaValorClasse}>
              {carregando
                ? '…'
                : indicadores
                  ? fmtInteiroRelatorio(indicadores.totalPlantoesRealizadosUti)
                  : '—'}
            </td>
          </tr>
        </tbody>
      </table>

      {indicadores && indicadores.horasPorSetor.length > 0 && !carregando ? (
        <div>
          <p className="mb-1.5 text-xs font-bold uppercase text-black">
            Horas por setor
          </p>
          <table className={tabelaIndicadoresClasse}>
            <thead>
              <tr>
                <th className={`${celulaEtiquetaClasse} bg-slate-100 print:bg-white`}>
                  Setor
                </th>
                <th className={`${celulaValorClasse} bg-slate-100 print:bg-white`}>
                  Horas
                </th>
                <th className={`${celulaValorClasse} bg-slate-100 print:bg-white`}>
                  Plantões
                </th>
              </tr>
            </thead>
            <tbody>
              {indicadores.horasPorSetor.map((row) => (
                <tr key={row.setor}>
                  <td className={celulaEtiquetaClasse}>{row.setor}</td>
                  <td className={celulaValorClasse}>{fmtHorasRelatorio(row.horas)} h</td>
                  <td className={celulaValorClasse}>{fmtInteiroRelatorio(row.plantoes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  )
}

function SecaoIndicadoresPeriodo({
  competenciaRotulo,
  indicadorUti,
  indicadorCirurgico,
  carregando,
}: SecaoIndicadoresPeriodoProps) {
  return (
    <section className="bloco-impressao mt-8 space-y-4">
      <header>
        <h3 className="text-center text-sm font-bold uppercase tracking-wide text-black">
          Indicadores do período
        </h3>
        <p className="mt-1 text-center text-xs text-black">
          Competência {competenciaRotulo}
          {carregando ? ' — A carregar dados…' : null}
        </p>
      </header>

      <div className="space-y-5">
        <div>
          <p className="mb-1.5 text-xs font-bold uppercase text-black">
            Unidade de terapia intensiva — busca activa
          </p>
          <table className={tabelaIndicadoresClasse}>
            <thead>
              <tr>
                <th
                  className={`${celulaEtiquetaClasse} bg-slate-100 print:bg-white`}
                >
                  Indicador
                </th>
                <th
                  className={`${celulaValorClasse} bg-slate-100 print:bg-white`}
                >
                  Valor
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={celulaEtiquetaClasse}>Setor</td>
                <td className={celulaValorClasse}>
                  {carregando ? '…' : indicadorUti?.setor ?? '—'}
                </td>
              </tr>
              <tr>
                <td className={celulaEtiquetaClasse}>
                  Pacientes / dia (média)
                </td>
                <td className={celulaValorClasse}>
                  {carregando
                    ? '…'
                    : indicadorUti
                      ? fmtDecimalRelatorio(indicadorUti.totalPacientesDia)
                      : '—'}
                </td>
              </tr>
              <tr>
                <td className={celulaEtiquetaClasse}>
                  Usuários acompanhados (busca activa)
                </td>
                <td className={celulaValorClasse}>
                  {carregando
                    ? '…'
                    : indicadorUti
                      ? fmtInteiroRelatorio(
                          indicadorUti.usuariosAcompanhadosBuscaAtiva,
                        )
                      : '—'}
                </td>
              </tr>
              <tr>
                <td className={celulaEtiquetaClasse}>Taxa de busca activa</td>
                <td className={celulaValorClasse}>
                  {carregando
                    ? '…'
                    : indicadorUti
                      ? fmtPercentualRelatorio(indicadorUti.taxaBuscaAtiva)
                      : '—'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-bold uppercase text-black">
            Centro cirúrgico — infecção em cirurgias limpas
          </p>
          <table className={tabelaIndicadoresClasse}>
            <thead>
              <tr>
                <th
                  className={`${celulaEtiquetaClasse} bg-slate-100 print:bg-white`}
                >
                  Indicador
                </th>
                <th
                  className={`${celulaValorClasse} bg-slate-100 print:bg-white`}
                >
                  Valor
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={celulaEtiquetaClasse}>Total de cirurgias</td>
                <td className={celulaValorClasse}>
                  {carregando
                    ? '…'
                    : indicadorCirurgico
                      ? fmtInteiroRelatorio(indicadorCirurgico.totalCirurgias)
                      : '—'}
                </td>
              </tr>
              <tr>
                <td className={celulaEtiquetaClasse}>Cirurgias limpas</td>
                <td className={celulaValorClasse}>
                  {carregando
                    ? '…'
                    : indicadorCirurgico
                      ? fmtInteiroRelatorio(
                          indicadorCirurgico.totalCirurgiasLimpas,
                        )
                      : '—'}
                </td>
              </tr>
              <tr>
                <td className={celulaEtiquetaClasse}>
                  Infecções em cirurgias limpas
                </td>
                <td className={celulaValorClasse}>
                  {carregando
                    ? '…'
                    : indicadorCirurgico
                      ? fmtInteiroRelatorio(
                          indicadorCirurgico.numInfeccoesCirurgiasLimpas,
                        )
                      : '—'}
                </td>
              </tr>
              <tr>
                <td className={celulaEtiquetaClasse}>
                  Taxa de infecção (cirurgias limpas)
                </td>
                <td className={celulaValorClasse}>
                  {carregando
                    ? '…'
                    : indicadorCirurgico
                      ? fmtPercentualRelatorio(indicadorCirurgico.taxaInfeccao)
                      : '—'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
