export type ParametroSecaoSlug =
  | 'grupos'
  | 'tipos-plantao'
  | 'situacoes-plantao'
  | 'valores'
  | 'auto-ajustes'
  | 'tipos-contratacao'
  | 'habilidades'

export type CampoTipo = 'text' | 'number' | 'boolean' | 'time' | 'color'

export type CampoParametro = {
  key: string
  label: string
  type: CampoTipo
  required?: boolean
  placeholder?: string
  minWidth?: string
}

export type SecaoParametroConfig = {
  slug: ParametroSecaoSlug
  titulo: string
  descricao: string
  tabela: string
  campos: CampoParametro[]
  colunasLista: string[]
}

export const SECOES_PARAMETROS: SecaoParametroConfig[] = [
  {
    slug: 'grupos',
    titulo: 'Grupos',
    descricao: 'Agrupamentos de hospitais e unidades para organização operacional.',
    tabela: 'config_grupos',
    campos: [
      { key: 'nome', label: 'Nome', type: 'text', required: true, placeholder: 'Ex.: Rede Norte' },
      { key: 'descricao', label: 'Descrição', type: 'text', placeholder: 'Opcional' },
      { key: 'ordem', label: 'Ordem', type: 'number', minWidth: 'w-20' },
      { key: 'ativo', label: 'Ativo', type: 'boolean' },
    ],
    colunasLista: ['nome', 'descricao', 'ordem', 'ativo'],
  },
  {
    slug: 'tipos-plantao',
    titulo: 'Tipos de Plantão',
    descricao: 'Turnos padrão utilizados na escala (ex.: Plantão 12h, Plantão 24h).',
    tabela: 'config_tipos_plantao',
    campos: [
      { key: 'nome', label: 'Nome', type: 'text', required: true, placeholder: 'Ex.: Plantão 12h' },
      { key: 'duracao_horas', label: 'Duração (h)', type: 'number', minWidth: 'w-24' },
      { key: 'hora_inicio_padrao', label: 'Início padrão', type: 'time', minWidth: 'w-28' },
      { key: 'hora_fim_padrao', label: 'Fim padrão', type: 'time', minWidth: 'w-28' },
      { key: 'ordem', label: 'Ordem', type: 'number', minWidth: 'w-20' },
      { key: 'ativo', label: 'Ativo', type: 'boolean' },
    ],
    colunasLista: ['nome', 'duracao_horas', 'hora_inicio_padrao', 'hora_fim_padrao', 'ativo'],
  },
  {
    slug: 'situacoes-plantao',
    titulo: 'Situações do Plantão',
    descricao: 'Labels personalizados de status exibidos na operação e nos relatórios.',
    tabela: 'config_situacoes_plantao',
    campos: [
      { key: 'codigo', label: 'Código', type: 'text', required: true, placeholder: 'Ex.: FNJ' },
      { key: 'rotulo', label: 'Rótulo', type: 'text', required: true, placeholder: 'Ex.: Falta não justificada' },
      { key: 'cor', label: 'Cor', type: 'color', minWidth: 'w-24' },
      { key: 'ordem', label: 'Ordem', type: 'number', minWidth: 'w-20' },
      { key: 'ativo', label: 'Ativo', type: 'boolean' },
    ],
    colunasLista: ['codigo', 'rotulo', 'cor', 'ativo'],
  },
  {
    slug: 'valores',
    titulo: 'Valores',
    descricao: 'Tabela de precificação dinâmica por hora para remuneração de plantões.',
    tabela: 'config_valores',
    campos: [
      { key: 'nome', label: 'Nome', type: 'text', required: true, placeholder: 'Ex.: Plantão diurno UTI' },
      { key: 'valor_hora', label: 'Valor / hora (R$)', type: 'number', minWidth: 'w-28' },
      { key: 'descricao', label: 'Descrição', type: 'text', placeholder: 'Opcional' },
      { key: 'ordem', label: 'Ordem', type: 'number', minWidth: 'w-20' },
      { key: 'ativo', label: 'Ativo', type: 'boolean' },
    ],
    colunasLista: ['nome', 'valor_hora', 'descricao', 'ativo'],
  },
  {
    slug: 'auto-ajustes',
    titulo: 'Auto-Ajustes',
    descricao: 'Regras automáticas de tolerância para o ponto eletrônico.',
    tabela: 'config_auto_ajustes',
    campos: [
      { key: 'nome', label: 'Nome', type: 'text', required: true, placeholder: 'Ex.: Tolerância padrão' },
      { key: 'tolerancia_entrada_min', label: 'Entrada (min)', type: 'number', minWidth: 'w-24' },
      { key: 'tolerancia_saida_min', label: 'Saída (min)', type: 'number', minWidth: 'w-24' },
      { key: 'auto_aprovar', label: 'Auto-aprovar', type: 'boolean' },
      { key: 'ordem', label: 'Ordem', type: 'number', minWidth: 'w-20' },
      { key: 'ativo', label: 'Ativo', type: 'boolean' },
    ],
    colunasLista: ['nome', 'tolerancia_entrada_min', 'tolerancia_saida_min', 'auto_aprovar', 'ativo'],
  },
  {
    slug: 'tipos-contratacao',
    titulo: 'Tipos de Contratação',
    descricao: 'Modelos de vínculo com profissionais (PJ, CLT, Cooperado, etc.).',
    tabela: 'config_tipos_contratacao',
    campos: [
      { key: 'nome', label: 'Nome', type: 'text', required: true, placeholder: 'Ex.: PJ' },
      { key: 'descricao', label: 'Descrição', type: 'text', placeholder: 'Opcional' },
      { key: 'ordem', label: 'Ordem', type: 'number', minWidth: 'w-20' },
      { key: 'ativo', label: 'Ativo', type: 'boolean' },
    ],
    colunasLista: ['nome', 'descricao', 'ativo'],
  },
  {
    slug: 'habilidades',
    titulo: 'Habilidades',
    descricao: 'Requisitos técnicos necessários para alocação em plantões (BLS, ACLS, etc.).',
    tabela: 'config_habilidades',
    campos: [
      { key: 'nome', label: 'Nome', type: 'text', required: true, placeholder: 'Ex.: ACLS' },
      { key: 'descricao', label: 'Descrição', type: 'text', placeholder: 'Opcional' },
      { key: 'obrigatoria', label: 'Obrigatória', type: 'boolean' },
      { key: 'ordem', label: 'Ordem', type: 'number', minWidth: 'w-20' },
      { key: 'ativo', label: 'Ativo', type: 'boolean' },
    ],
    colunasLista: ['nome', 'descricao', 'obrigatoria', 'ativo'],
  },
]

export const SECOES_POR_SLUG = Object.fromEntries(
  SECOES_PARAMETROS.map((s) => [s.slug, s]),
) as Record<ParametroSecaoSlug, SecaoParametroConfig>

export const SLUGS_PARAMETROS = SECOES_PARAMETROS.map((s) => s.slug)

export function secaoValida(slug: string | undefined): slug is ParametroSecaoSlug {
  return slug !== undefined && slug in SECOES_POR_SLUG
}

export type ParametroRow = Record<string, unknown> & {
  id: string
  user_id: string
  created_at: string
  updated_at: string
}

export type ParametroDraft = {
  key: string
  id?: string
  valores: Record<string, string | boolean>
  saving?: boolean
}

export function rowParaDraft(
  row: ParametroRow,
  config: SecaoParametroConfig,
): ParametroDraft {
  const valores: Record<string, string | boolean> = {}
  for (const campo of config.campos) {
    const bruto = row[campo.key]
    if (campo.type === 'boolean') {
      valores[campo.key] = Boolean(bruto)
    } else if (bruto == null) {
      valores[campo.key] = campo.type === 'number' ? '0' : ''
    } else {
      valores[campo.key] = String(bruto)
    }
  }
  return { key: row.id, id: row.id, valores }
}

export function novaLinhaDraft(config: SecaoParametroConfig): ParametroDraft {
  const valores: Record<string, string | boolean> = {}
  for (const campo of config.campos) {
    if (campo.type === 'boolean') {
      valores[campo.key] =
        campo.key === 'obrigatoria' || campo.key === 'auto_aprovar' ? false : true
    } else if (campo.type === 'number') {
      valores[campo.key] = campo.key.includes('tolerancia') ? '5' : '0'
    } else if (campo.type === 'color') {
      valores[campo.key] = '#64748b'
    } else {
      valores[campo.key] = ''
    }
  }
  return { key: `new-${crypto.randomUUID()}`, valores }
}

export function draftParaPayload(
  draft: ParametroDraft,
  config: SecaoParametroConfig,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  for (const campo of config.campos) {
    const bruto = draft.valores[campo.key]
    if (campo.type === 'boolean') {
      payload[campo.key] = Boolean(bruto)
    } else if (campo.type === 'number') {
      payload[campo.key] = Number(String(bruto).replace(',', '.')) || 0
    } else {
      const texto = String(bruto ?? '').trim()
      payload[campo.key] = texto || null
    }
  }
  return payload
}

export function labelCampo(config: SecaoParametroConfig, key: string): string {
  return config.campos.find((c) => c.key === key)?.label ?? key
}
