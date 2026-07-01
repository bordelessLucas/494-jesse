import { RelatoriosPage } from '../Dashboard/RelatoriosPage'

export function RelatorioPlantaoFaltasPage() {
  return <RelatoriosPage key="relatorio-faltas" tipoInicial="faltas" />
}

export function RelatorioPlantaoEscalasPage() {
  return <RelatoriosPage key="relatorio-escalas" tipoInicial="escala" />
}

export function RelatorioPlantaoProfissionaisPage() {
  return <RelatoriosPage key="relatorio-profissionais" tipoInicial="plantoes" />
}

export function RelatorioPlantaoCoordenadoresPage() {
  return (
    <RelatoriosPage key="relatorio-coordenadores" tipoInicial="trocas_passagens" />
  )
}
