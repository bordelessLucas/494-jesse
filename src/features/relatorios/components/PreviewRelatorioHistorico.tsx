import { FrequenciaCoordenacaoTemplate } from '../templates/FrequenciaCoordenacaoTemplate'
import { FrequenciaSetorTemplate } from '../templates/FrequenciaSetorTemplate'
import { RelatorioAtividadesTemplate } from '../templates/RelatorioAtividadesTemplate'
import type {
  EscalaCoordenacaoEntrada,
  EscalaFrequenciaSetorEntrada,
} from '../types'
import type { DadosPreviewHistorico } from '../utils/parseHistoricoRelatorio'

const ESCALA_SETOR_VAZIA: EscalaFrequenciaSetorEntrada[] = []
const ESCALA_COORDENACAO_VAZIA: EscalaCoordenacaoEntrada[] = []

type PreviewRelatorioHistoricoProps = {
  dados: DadosPreviewHistorico
}

export function PreviewRelatorioHistorico({ dados }: PreviewRelatorioHistoricoProps) {
  switch (dados.tipo) {
    case 'FrequenciaSetor':
      return (
        <FrequenciaSetorTemplate
          cabecalho={dados.cabecalho}
          turnos={dados.turnosFrequenciaSetor}
          escala={ESCALA_SETOR_VAZIA}
          totalDias={dados.totalDias}
        />
      )

    case 'FrequenciaCoordenacao':
      return (
        <FrequenciaCoordenacaoTemplate
          cabecalho={dados.cabecalho}
          escala={ESCALA_COORDENACAO_VAZIA}
          totalDias={dados.totalDias}
        />
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
