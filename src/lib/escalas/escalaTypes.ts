export type TomCartao = 'util' | 'fds'

export type StatusPlantaoEscala = 'vago' | 'confirmado' | 'pendente'

export type PlantaoCartao = {
  id: string
  nome: string
  horaInicio: string
  horaFim: string
  tom: TomCartao
  status?: StatusPlantaoEscala
  profissionalId?: string | null
}

export type ContextoModalPlantao = {
  dia: Date
  cartao: PlantaoCartao
  localId: string
  setorId: string
  /** Definido apenas para plantão já persistido no Supabase */
  plantaoId?: string | null
  profissionalId?: string | null
}
