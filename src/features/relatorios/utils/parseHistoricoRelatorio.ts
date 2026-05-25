import type { IndicadorCirurgico, IndicadorUti } from '../../sciras/types'
import type {
  RelatorioHistoricoRow,
  TipoRelatorioHistorico,
} from '../../../lib/relatorios/relatoriosHistoricoDb'
import type {
  AssinaturaResponsavel,
  CabecalhoContratualData,
  RelatorioAtividadesBloco,
  TurnoFrequencia,
} from '../types'

const MESES_PT_BR = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

export const ROTULOS_TIPO_RELATORIO: Record<TipoRelatorioHistorico, string> = {
  FrequenciaSetor: 'Lista de Frequência — UTI Pediátrica',
  FrequenciaCoordenacao: 'Lista de Frequência — SCIH (Coordenação)',
  RelatorioSCIRAS: 'Relatório de Atividades — SCIRAS',
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function texto(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function numero(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

export function montarAssinaturaAPartirDoCabecalho(
  cab: CabecalhoContratualData,
): AssinaturaResponsavel {
  return {
    nomeProfissional: cab.coordenador,
    crmRqe: 'CRM/SP 123456 — RQE 7890',
    nomeEmpresa: cab.empresa,
    cnpjEmpresa: cab.cnpj,
  }
}

export function formatarDataEmissaoHistorico(
  impressoEm: string,
  competenciaCabecalho: string,
): string {
  const data = new Date(impressoEm)
  if (Number.isNaN(data.getTime())) {
    return `Competência ${competenciaCabecalho}`
  }
  const dia = String(data.getDate()).padStart(2, '0')
  const mes = MESES_PT_BR[data.getMonth()].toLowerCase()
  const ano = data.getFullYear()
  return `São Paulo, ${dia} de ${mes} de ${ano} — Competência ${competenciaCabecalho}`
}

export function parseCabecalhoHistorico(
  row: RelatorioHistoricoRow,
  logoUrlFallback: string | null,
): CabecalhoContratualData {
  const snap = isRecord(row.snapshot) ? row.snapshot : {}
  const cabSnap = isRecord(snap.cabecalho) ? snap.cabecalho : null
  const cabRow = isRecord(row.cabecalho) ? row.cabecalho : {}

  const fonte = cabSnap ?? cabRow

  return {
    logoUrl:
      typeof fonte.logoUrl === 'string' || fonte.logoUrl === null
        ? (fonte.logoUrl as string | null)
        : logoUrlFallback,
    contratoGestao: texto(fonte.contratoGestao),
    contratoPrestacao: texto(fonte.contratoPrestacao),
    local: texto(fonte.local, row.local_nome),
    servico: texto(fonte.servico),
    tomador: texto(fonte.tomador),
    empresa: texto(fonte.empresa),
    cnpj: texto(fonte.cnpj),
    coordenador: texto(fonte.coordenador),
    competencia: texto(fonte.competencia, row.competencia),
  }
}

export type DadosPreviewHistorico = {
  tipo: TipoRelatorioHistorico
  cabecalho: CabecalhoContratualData
  totalDias: number
  turnosFrequenciaSetor: TurnoFrequencia[]
  blocosSCIRAS: RelatorioAtividadesBloco[]
  indicadorUti: IndicadorUti | null
  indicadorCirurgico: IndicadorCirurgico | null
  dataEmissao: string
  competenciaRotulo: string
  assinatura: AssinaturaResponsavel
}

export function parseHistoricoParaPreview(
  row: RelatorioHistoricoRow,
  logoUrlFallback: string | null,
): DadosPreviewHistorico {
  const snap = isRecord(row.snapshot) ? row.snapshot : {}
  const cabecalho = parseCabecalhoHistorico(row, logoUrlFallback)

  const blocosRaw = snap.blocosSCIRAS
  const blocosSCIRAS = Array.isArray(blocosRaw)
    ? (blocosRaw as RelatorioAtividadesBloco[])
    : []

  const turnosRaw = snap.rotulosTurnosFrequenciaSetor
  const turnosFrequenciaSetor = Array.isArray(turnosRaw)
    ? (turnosRaw as TurnoFrequencia[])
    : []

  return {
    tipo: row.tipo_relatorio,
    cabecalho,
    totalDias: numero(snap.totalDias, 31),
    turnosFrequenciaSetor,
    blocosSCIRAS,
    indicadorUti: (snap.indicadorUti as IndicadorUti | null) ?? null,
    indicadorCirurgico:
      (snap.indicadorCirurgico as IndicadorCirurgico | null) ?? null,
    dataEmissao: formatarDataEmissaoHistorico(row.impresso_em, cabecalho.competencia),
    competenciaRotulo: cabecalho.competencia,
    assinatura: montarAssinaturaAPartirDoCabecalho(cabecalho),
  }
}
