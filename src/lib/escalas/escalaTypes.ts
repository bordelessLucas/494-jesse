import type { StatusConfirmacaoEscala } from './confirmacaoEscalaTypes'

export type TomCartao = 'util' | 'fds'

export type StatusPlantaoEscala =
  | 'vago'
  | 'confirmado'
  | 'pendente'
  | 'realizado'
  | 'pendente_troca'

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
  /** Valor bruto cadastrado (persistido em `plantoes.valor_plantao`). */
  valorPlantao?: number
  /** Plantão visível no Mural de Trocas (`plantoes.disponivel_mural`). */
  disponivelMural?: boolean
  confirmadoProfissional?: boolean
  dataConfirmacaoProfissional?: string | null
  motivoRecusa?: string | null
  confirmacaoStatus?: StatusConfirmacaoEscala | null
}
