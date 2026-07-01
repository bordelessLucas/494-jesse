import { RelatoriosPage } from '../Dashboard/RelatoriosPage'

export function RelatorioPlantaoFaltasPage() {
  return <RelatoriosPage tipoInicial="faltas" />
}

export function RelatorioPlantaoEscalasPage() {
  return <RelatoriosPage tipoInicial="escala" />
}

export function RelatorioPlantaoProfissionaisPage() {
  return <RelatoriosPage tipoInicial="plantoes" />
}

export function RelatorioPlantaoCoordenadoresPage() {
  return <RelatoriosPage tipoInicial="trocas_passagens" />
}
