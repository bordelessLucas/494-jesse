import { CabecalhoContratual } from '../components/CabecalhoContratual'
import { PaginaA4 } from '../components/PaginaA4'
import type {
  AssinaturaResponsavel,
  CabecalhoContratualData,
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
  /** Quando verdadeiro, os dados ainda estão a ser obtidos do servidor. */
  indicadoresCarregando?: boolean
  assinatura: AssinaturaResponsavel
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
  indicadoresCarregando = false,
  assinatura,
}: RelatorioAtividadesTemplateProps) {
  return (
    <PaginaA4>
      <CabecalhoContratual {...cabecalho} />

      <p className="mt-4 text-right text-sm">{dataEmissao}</p>

      <h2 className="mt-6 text-center text-sm font-bold uppercase tracking-wide">
        {TITULO_RELATORIO}
      </h2>

      <section className="mt-6 space-y-4 text-justify text-sm leading-relaxed">
        {conteudo.map((bloco, index) => (
          <BlocoConteudoRelatorio key={index} bloco={bloco} />
        ))}
      </section>

      <SecaoIndicadoresPeriodo
        competenciaRotulo={competenciaRotulo}
        indicadorUti={indicadorUti}
        indicadorCirurgico={indicadorCirurgico}
        carregando={indicadoresCarregando}
      />

      <RodapeAssinatura assinatura={assinatura} />
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

type RodapeAssinaturaProps = {
  assinatura: AssinaturaResponsavel
}

function RodapeAssinatura({ assinatura }: RodapeAssinaturaProps) {
  return (
    <footer className="mt-16 break-inside-avoid">
      <div className="grid grid-cols-[1fr_auto] items-end gap-8">
        <div className="text-center">
          <div className="mx-auto max-w-md border-t border-black pt-2">
            <p className="text-sm font-bold uppercase tracking-wide">
              {assinatura.nomeProfissional}
            </p>
            <p className="text-xs">{assinatura.crmRqe}</p>
            <p className="mt-3 text-sm font-bold">{assinatura.nomeEmpresa}</p>
            <p className="text-xs">CNPJ: {assinatura.cnpjEmpresa}</p>
          </div>
        </div>

        <AssinaturaDigitalGovBrPlaceholder />
      </div>
    </footer>
  )
}

/**
 * Área quadrada reservada para o selo/QR Code da Assinatura Digital gov.br.
 *
 * Durante a fase atual de impressão manual, exibe um placeholder tracejado
 * com instruções. Quando a integração for ativada, este componente passa a
 * receber a imagem/QR via prop e o estilo tracejado é substituído por borda
 * sólida fina.
 */
function AssinaturaDigitalGovBrPlaceholder() {
  return (
    <aside className="w-40 shrink-0">
      <div className="flex h-40 w-40 flex-col items-center justify-center gap-1 border border-dashed border-black p-2 text-center text-[10px] leading-tight">
        <span className="font-bold uppercase">Assinatura Digital</span>
        <span className="font-bold">gov.br</span>
        <span className="mt-2 text-[9px]">
          Espaço reservado para o selo de validação digital
        </span>
      </div>
    </aside>
  )
}
