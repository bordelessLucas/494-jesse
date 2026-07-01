import { EmissaoRelatorioUtiPage } from '../../features/gestao/emissao/EmissaoRelatorioUtiPage'

export function EmissaoUtiAdultoPage() {
  return (
    <EmissaoRelatorioUtiPage
      key="plantao-check:emissao-uti-adulto"
      config={{
        setorUti: 'UTI Adulto',
        tituloPagina: 'Relatório UTI Adulto',
        tituloRelatorio: 'RELATÓRIO DE ATIVIDADES — UTI ADULTO',
        tipoRelatorioHistorico: 'RelatorioUTIAdulto',
        servicoPadrao: 'UTI Adulto',
        chaveRascunho: 'plantao-check:emissao-uti-adulto:rascunho',
      }}
    />
  )
}
