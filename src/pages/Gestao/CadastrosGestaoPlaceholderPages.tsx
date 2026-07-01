import { EmDesenvolvimentoPlaceholder } from '../../components/placeholder/EmDesenvolvimentoPlaceholder'

export function TipoServicoScihPage() {
  return <EmDesenvolvimentoPlaceholder titulo="SCIH" secao="Cadastros (Gestão) — Tipo de Serviço" />
}

export function TipoServicoUtiAdultoPage() {
  return (
    <EmDesenvolvimentoPlaceholder titulo="UTI Adulto" secao="Cadastros (Gestão) — Tipo de Serviço" />
  )
}

export function TipoServicoUtiPediatricaPage() {
  return (
    <EmDesenvolvimentoPlaceholder
      titulo="UTI Pediátrica"
      secao="Cadastros (Gestão) — Tipo de Serviço"
    />
  )
}

export function TipoServicoPage() {
  return <TipoServicoScihPage />
}

export function UtilizadorCoordenadorGestaoPage() {
  return (
    <EmDesenvolvimentoPlaceholder
      titulo="Utilizadores — Coordenador"
      secao="Cadastros (Gestão)"
    />
  )
}

export function UtilizadorAuditorPage() {
  return (
    <EmDesenvolvimentoPlaceholder
      titulo="Utilizadores — Auditor"
      secao="Cadastros (Gestão)"
    />
  )
}

export function UtilizadorFaturistaPage() {
  return (
    <EmDesenvolvimentoPlaceholder
      titulo="Utilizadores — Faturista"
      secao="Cadastros (Gestão)"
    />
  )
}
