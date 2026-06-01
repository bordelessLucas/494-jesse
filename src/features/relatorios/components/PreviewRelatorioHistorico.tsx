import { FrequenciaCoordenacaoTemplate } from '../templates/FrequenciaCoordenacaoTemplate'
import { FrequenciaListaDetalhadaTemplate } from '../templates/FrequenciaListaDetalhadaTemplate'
import { FrequenciaSetorTemplate } from '../templates/FrequenciaSetorTemplate'
import { RelatorioAtividadesTemplate } from '../templates/RelatorioAtividadesTemplate'
import type { DadosPreviewHistorico } from '../utils/parseHistoricoRelatorio'

type PreviewRelatorioHistoricoProps = {
  dados: DadosPreviewHistorico
}

export function PreviewRelatorioHistorico({ dados }: PreviewRelatorioHistoricoProps) {
  switch (dados.tipo) {
    case 'FrequenciaSetor':
      return (
        <div className="flex flex-col gap-8">
          {dados.linhasFrequencia.length > 0 ? (
            <FrequenciaListaDetalhadaTemplate
              cabecalho={dados.cabecalho}
              titulo={`Lista de Frequência — ${dados.cabecalho.servico}`}
              linhas={dados.linhasFrequencia}
              totalPlantoes={dados.linhasFrequencia.length}
            />
          ) : null}
          <FrequenciaSetorTemplate
            cabecalho={dados.cabecalho}
            turnos={dados.turnosFrequenciaSetor}
            escala={dados.escalaSetor}
            totalDias={dados.totalDias}
          />
        </div>
      )

    case 'FrequenciaCoordenacao':
      return (
        <div className="flex flex-col gap-8">
          {dados.linhasFrequencia.length > 0 ? (
            <FrequenciaListaDetalhadaTemplate
              cabecalho={dados.cabecalho}
              titulo={`Lista de Frequência — Coordenação ${dados.cabecalho.servico}`}
              linhas={dados.linhasFrequencia}
              totalPlantoes={dados.linhasFrequencia.length}
            />
          ) : null}
          <FrequenciaCoordenacaoTemplate
            cabecalho={dados.cabecalho}
            escala={dados.escalaCoordenacao}
            totalDias={dados.totalDias}
          />
        </div>
      )

    case 'RelatorioSCIRAS':
      return (
        <RelatorioAtividadesTemplate
          cabecalho={dados.cabecalho}
          dataEmissao={dados.dataEmissao}
          conteudo={dados.blocosSCIRAS}
          competenciaRotulo={dados.competenciaRotulo}
          indicadorUti={dados.indicadorUti}
          indicadorCirurgico={dados.indicadorCirurgico}
          indicadoresEscala={dados.indicadoresEscala}
          indicadoresCarregando={false}
          assinatura={dados.assinatura}
        />
      )

    default: {
      const _impossivel: never = dados.tipo
      return _impossivel
    }
  }
}
