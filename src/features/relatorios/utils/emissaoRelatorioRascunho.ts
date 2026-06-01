import type { RelatorioAtividadesBloco, TurnoFrequencia } from '../types'

const STORAGE_KEY = 'plantao-check:emissao-relatorios:rascunho'

export type TipoRelatorioRascunho =
  | 'FrequenciaSetor'
  | 'FrequenciaCoordenacao'
  | 'RelatorioSCIRAS'

export type LocalContratoRascunho = string

export type CabecalhoTextoRascunho = {
  contratoGestao: string
  contratoPrestacao: string
  local: string
  servico: string
  tomador: string
  empresa: string
  cnpj: string
  coordenador: string
  competencia: string
}

export type EmissaoRelatorioRascunho = {
  tipoSelecionado: TipoRelatorioRascunho
  competenciaId: string
  localId: LocalContratoRascunho
  cabecalhoTexto: CabecalhoTextoRascunho
  rotulosTurnosFrequenciaSetor: TurnoFrequencia[]
  blocosSCIRAS: RelatorioAtividadesBloco[]
}

const TIPOS_VALIDOS = new Set<TipoRelatorioRascunho>([
  'FrequenciaSetor',
  'FrequenciaCoordenacao',
  'RelatorioSCIRAS',
])

const LOCAIS_VALIDOS = new Set<LocalContratoRascunho>([
  'hospital_estadual_xyz',
  'hospital_municipal_abc',
])

function localIdValido(localId: string): boolean {
  if (LOCAIS_VALIDOS.has(localId as LocalContratoRascunho)) return true
  return /^[0-9a-f-]{36}$/i.test(localId)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function texto(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function parseCabecalho(value: unknown): CabecalhoTextoRascunho | null {
  if (!isRecord(value)) return null
  return {
    contratoGestao: texto(value.contratoGestao),
    contratoPrestacao: texto(value.contratoPrestacao),
    local: texto(value.local),
    servico: texto(value.servico),
    tomador: texto(value.tomador),
    empresa: texto(value.empresa),
    cnpj: texto(value.cnpj),
    coordenador: texto(value.coordenador),
    competencia: texto(value.competencia),
  }
}

function parseBlocos(value: unknown): RelatorioAtividadesBloco[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is RelatorioAtividadesBloco => {
    if (!isRecord(item) || typeof item.clientKey !== 'string') return false
    if (item.type === 'text') return typeof item.content === 'string'
    if (item.type === 'image') return typeof item.url === 'string'
    return false
  })
}

function parseRascunho(value: unknown): EmissaoRelatorioRascunho | null {
  if (!isRecord(value)) return null

  const tipo = value.tipoSelecionado
  const localId = value.localId
  const competenciaId = texto(value.competenciaId)
  const cabecalhoTexto = parseCabecalho(value.cabecalhoTexto)

  if (
    typeof tipo !== 'string' ||
    !TIPOS_VALIDOS.has(tipo as TipoRelatorioRascunho) ||
    typeof localId !== 'string' ||
    !localIdValido(localId) ||
    !competenciaId ||
    !cabecalhoTexto
  ) {
    return null
  }

  const turnos = value.rotulosTurnosFrequenciaSetor
  const rotulosTurnosFrequenciaSetor = Array.isArray(turnos)
    ? turnos.filter((t): t is TurnoFrequencia => typeof t === 'string')
    : []

  return {
    tipoSelecionado: tipo as TipoRelatorioRascunho,
    competenciaId,
    localId,
    cabecalhoTexto,
    rotulosTurnosFrequenciaSetor,
    blocosSCIRAS: parseBlocos(value.blocosSCIRAS),
  }
}

export function lerEmissaoRelatorioRascunho(): EmissaoRelatorioRascunho | null {
  if (typeof sessionStorage === 'undefined') return null
  try {
    const bruto = sessionStorage.getItem(STORAGE_KEY)
    if (!bruto) return null
    return parseRascunho(JSON.parse(bruto))
  } catch {
    return null
  }
}

export function salvarEmissaoRelatorioRascunho(
  rascunho: EmissaoRelatorioRascunho,
): void {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(rascunho))
  } catch {
    // Quota excedida ou modo privado — ignorar silenciosamente.
  }
}
