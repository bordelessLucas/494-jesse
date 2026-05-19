import type {
  ProfissionalEndereco,
  ProfissionalGrupoParticipacao,
} from '../Profissionais/profissionalTypes'

/** Definições de permissões configuráveis (persistidas em `detalhes.permissoes`). */
export const PERMISSOES_COORDENADOR = [
  { key: 'escalas_visualizar', label: 'Visualizar escalas' },
  { key: 'escalas_editar', label: 'Editar escalas semanais e mensais' },
  { key: 'relatorios_emitir', label: 'Emitir relatórios' },
  { key: 'indicadores_sciras', label: 'Consultar indicadores SCIRAS' },
  { key: 'usuarios_coordenadores', label: 'Gerir coordenadores' },
  { key: 'usuarios_profissionais', label: 'Consultar profissionais' },
] as const

export type ChavePermissaoCoordenador =
  (typeof PERMISSOES_COORDENADOR)[number]['key']

export interface CoordenadorDetalhes {
  endereco: ProfissionalEndereco
  grupos: ProfissionalGrupoParticipacao[]
  permissoes: Partial<Record<ChavePermissaoCoordenador, boolean>>
  /** Texto livre da aba «Áreas» (resumo ou observações espaciais). */
  areasNotas: string
  observacaoInterna?: string
}

export interface FormCoordenador {
  nomeCompleto: string
  email: string
  telefone1: string
  telefone2: string
  localId: string
  enderecoCep: string
  enderecoRua: string
  enderecoNumero: string
  enderecoBairro: string
  enderecoComplemento: string
  enderecoUf: string
  enderecoCidade: string
  setoresVinculadosIds: string[]
  permissoes: Record<string, boolean>
  areasNotas: string
}

export interface CoordenadorCompleto {
  id: string
  nome: string
  email: string | null
  telefone: string | null
  telefone2: string | null
  localId: string | null
  localNome: string
  setores: string[]
  /** Ids vindos de `coordenador_setores`. */
  setorIdsVinculados: string[]
  nomesGruposLista: string[]
  detalhes: CoordenadorDetalhes
}
