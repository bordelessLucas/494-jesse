import { CabecalhoContratual } from '../components/CabecalhoContratual'
import { PaginaA4 } from '../components/PaginaA4'
import type {
  AssinaturaResponsavel,
  CabecalhoContratualData,
  RelatorioAtividadesBloco,
} from '../types'

type RelatorioAtividadesTemplateProps = {
  cabecalho: CabecalhoContratualData
  /** Local + data já formatados, ex.: "São Paulo, 12 de maio de 2026". */
  dataEmissao: string
  /** Blocos digitados pelo coordenador no formulário do sistema. */
  conteudo: RelatorioAtividadesBloco[]
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
