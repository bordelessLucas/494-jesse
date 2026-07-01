import { FrequenciaGestaoPage } from '../../features/gestao/frequencia/FrequenciaGestaoPage'
import { FrequenciaProducaoGestaoPage } from '../../features/gestao/frequencia/FrequenciaProducaoGestaoPage'

export function FrequenciaQuinzenalPage() {
  return (
    <FrequenciaGestaoPage
      key="frequencia-quinzenal"
      modo="quinzenal"
      tituloPagina="Frequência Quinzenal"
      tituloRelatorio="Mapa de Frequência Quinzenal"
    />
  )
}

export function FrequenciaMensalPage() {
  return (
    <FrequenciaGestaoPage
      key="frequencia-mensal"
      modo="mensal"
      tituloPagina="Frequência Mensal"
      tituloRelatorio="Mapa de Frequência Mensal"
    />
  )
}

export function FrequenciaSemanalPage() {
  return (
    <FrequenciaGestaoPage
      key="frequencia-semanal"
      modo="semanal"
      tituloPagina="Frequência Semanal"
      tituloRelatorio="Mapa de Frequência Semanal"
    />
  )
}

export function FrequenciaProducaoPage() {
  return <FrequenciaProducaoGestaoPage />
}
