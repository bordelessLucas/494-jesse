export type SlugTipoServicoGestao = 'scih' | 'uti_adulto' | 'uti_pediatrica'

export type TipoCalculoAcrescimoGestao =
  | 'percentual'
  | 'valor_fixo_hora'
  | 'valor_fixo_plantao'

export type TipoServicoGestao = {
  id: string
  user_id: string
  slug: SlugTipoServicoGestao
  titulo: string
  observacoes: string | null
  ativo: boolean
}

export type AcrescimoTipoServicoGestao = {
  id: string
  user_id: string
  tipo_servico_id: string
  especialidade: string
  tipo_calculo: TipoCalculoAcrescimoGestao
  valor: number
  ativo: boolean
  ordem: number
}

export type SetorTipoServicoGestao = {
  id: string
  user_id: string
  tipo_servico_id: string
  setor_id: string
  setorNome?: string
  localNome?: string
}

export type ConfigTipoServicoCompleta = {
  tipo: TipoServicoGestao
  acrescimos: AcrescimoTipoServicoGestao[]
  setores: SetorTipoServicoGestao[]
}

export const ROTULOS_TIPO_SERVICO: Record<SlugTipoServicoGestao, string> = {
  scih: 'SCIH',
  uti_adulto: 'UTI Adulto',
  uti_pediatrica: 'UTI Pediátrica',
}

export const TIPO_CALCULO_OPCOES: { value: TipoCalculoAcrescimoGestao; label: string }[] = [
  { value: 'percentual', label: 'Percentual (%)' },
  { value: 'valor_fixo_hora', label: 'Valor fixo por hora (R$)' },
  { value: 'valor_fixo_plantao', label: 'Valor fixo por plantão (R$)' },
]
