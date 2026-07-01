import { TipoServicoGestaoPage } from '../../features/gestao/cadastros/TipoServicoGestaoPage'

export function TipoServicoScihPage() {
  return <TipoServicoGestaoPage slug="scih" />
}

export function TipoServicoUtiAdultoPage() {
  return <TipoServicoGestaoPage slug="uti_adulto" />
}

export function TipoServicoUtiPediatricaPage() {
  return <TipoServicoGestaoPage slug="uti_pediatrica" />
}

export function TipoServicoPage() {
  return <TipoServicoScihPage />
}
