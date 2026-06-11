export const RAIO_CHECKIN_METROS = 300

export function mensagemBloqueioDistancia(raioMetros = RAIO_CHECKIN_METROS): string {
  return `Tem de estar num raio de ${raioMetros}m do hospital para bater o ponto.`
}

export const MENSAGEM_CHECKIN_BLOQUEADO = mensagemBloqueioDistancia()

export function isErroDistanciaCheckin(mensagem: string): boolean {
  return mensagem.includes('raio de') && mensagem.includes('hospital')
}

export type StatusRegistroPonto = 'validado' | 'pendente' | 'rejeitado'

export type PlantaoPontoHoje = {
  id: string
  data_plantao: string
  hora_inicio: string
  hora_fim: string
  status: string
  local_id: string
  setor_id: string
  hospital: string
  setor: string
  latitude: number | null
  longitude: number | null
}

export type RegistroPontoRow = {
  id: string
  user_id: string
  profissional_id: string
  plantao_id: string
  entrada_em: string
  saida_em: string | null
  latitude_entrada: number
  longitude_entrada: number
  latitude_saida: number | null
  longitude_saida: number | null
  distancia_entrada_metros: number | null
  distancia_saida_metros: number | null
  status: StatusRegistroPonto
  created_at: string
  updated_at: string
}

export const ROTULOS_STATUS_PONTO: Record<StatusRegistroPonto, string> = {
  validado: 'Validado',
  pendente: 'Pendente',
  rejeitado: 'Rejeitado',
}
