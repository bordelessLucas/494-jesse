export type TipoCalculoAcrescimo = 'percentual' | 'valor_fixo_hora' | 'valor_fixo_plantao'

export type GatilhoAcrescimo = 'fim_de_semana' | 'feriado' | 'especialidade'

export type TipoPlantaoRemuneracao = {
  id: string
  user_id: string
  nome: string
  descricao: string | null
  multiplicador: number
  ativo: boolean
  ordem: number
}

export type AcrescimoRemuneracao = {
  id: string
  user_id: string
  nome: string
  tipo_calculo: TipoCalculoAcrescimo
  valor: number
  gatilho: GatilhoAcrescimo
  especialidade_contem: string | null
  ativo: boolean
  ordem: number
}

export type FeriadoRemuneracao = {
  id: string
  user_id: string
  data_feriado: string
  nome: string
}

export type RegrasRemuneracao = {
  tiposPlantao: TipoPlantaoRemuneracao[]
  acrescimos: AcrescimoRemuneracao[]
  feriados: FeriadoRemuneracao[]
}

export type PlantaoParaRemuneracao = {
  dataPlantao: string
  horaInicio: string
  horaFim: string
  valorPlantaoBase: number
  remuneracaoTipoId: string | null
  especialidadeProfissional: string | null
}

export type ResultadoValorBrutoRemuneracao = {
  valorBruto: number
  valorBase: number
  etiquetas: string[]
}
