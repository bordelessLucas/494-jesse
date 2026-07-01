import { EmissaoRelatorioUtiPage } from '../../features/gestao/emissao/EmissaoRelatorioUtiPage'

export function EmissaoUtiPediatricaPage() {
  return (
    <EmissaoRelatorioUtiPage
      key="plantao-check:emissao-uti-pediatrica"
      config={{
        setorUti: 'UTI Pediátrica',
        tituloPagina: 'Relatório UTI Pediátrica',
        tituloRelatorio: 'RELATÓRIO DE ATIVIDADES — UTI PEDIÁTRICA',
        tipoRelatorioHistorico: 'RelatorioUTIPediatrica',
        servicoPadrao: 'UTI Pediátrica',
        chaveRascunho: 'plantao-check:emissao-uti-pediatrica:rascunho',
      }}
    />
  )
}
