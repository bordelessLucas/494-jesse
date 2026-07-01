export type ConselhoClasseEspecialidade = 'CRM' | 'COREN'

export type EspecialidadeRow = {
  id: string
  user_id: string
  nome: string
  conselho_classe: ConselhoClasseEspecialidade
  valor_base_hora: number
  ativo: boolean
  created_at: string
  updated_at: string
}

export const CONSELHO_CLASSE_OPCOES: { value: ConselhoClasseEspecialidade; label: string }[] = [
  { value: 'CRM', label: 'CRM — Conselho Regional de Medicina' },
  { value: 'COREN', label: 'COREN — Conselho Regional de Enfermagem' },
]
