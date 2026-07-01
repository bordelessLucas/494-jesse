import { UtilizadoresGestaoPage } from '../../features/gestao/cadastros/UtilizadoresGestaoPage'

export function UtilizadorCoordenadorGestaoPage() {
  return <UtilizadoresGestaoPage perfil="coordenador" />
}

export function UtilizadorAuditorPage() {
  return <UtilizadoresGestaoPage perfil="auditor" />
}

export function UtilizadorFaturistaPage() {
  return <UtilizadoresGestaoPage perfil="faturista" />
}
