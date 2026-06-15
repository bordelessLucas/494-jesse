import {
  endOfWeek,
  format,
  startOfWeek,
  subDays,
} from 'date-fns'

import { duracaoHorasPlantao } from '../dashboard/plantaoHoras'
import { supabase } from '../supabase'
import {
  chaveDataPlantaoDb,
  formatarHoraDb,
  type PlantaoRowDb,
} from './plantoesDb'
import type { StatusPlantaoEscala } from './escalaTypes'

/** Limite recomendado de horas semanais para alerta de compliance. */
export const LIMITE_HORAS_SEMANAL_COMPLIANCE = 60

/** Prefixo persistido em `plantoes.observacoes` para justificativas de coordenação. */
export const PREFIXO_JUSTIFICATIVA_COORDENACAO =
  '[Coordenação — justificativa de carga >60h]:'

/** Status considerados alocação ativa (choque de horário e carga semanal). */
export const STATUS_PLANTAO_ATIVO_COMPLIANCE: StatusPlantaoEscala[] = [
  'confirmado',
  'pendente',
  'realizado',
  'pendente_troca',
]

export type PlantaoComplianceRow = PlantaoRowDb & {
  locais?: { nome_fantasia: string } | null
}

export type ResultadoChoqueHorario = {
  temChoque: boolean
  hospitalNome?: string
  plantaoConflitanteId?: string
  mensagem?: string
}

export type ResultadoAvisoCargaSemanal = {
  excedeLimite: boolean
  horasAcumuladas: number
  horasNovoPlantao: number
  horasTotais: number
  mensagem?: string
}

/** Constrói intervalo real do plantão (inclui virada de dia). */
export function intervaloPlantao(
  dataPlantaoIso: string,
  horaInicio: string,
  horaFim: string,
): { inicio: Date; fim: Date } {
  const chave = chaveDataPlantaoDb(dataPlantaoIso)
  const [y, mo, d] = chave.split('-').map(Number)
  const hi = formatarHoraDb(horaInicio)
  const hf = formatarHoraDb(horaFim)
  const [hIn, mIn] = hi.split(':').map(Number)
  const [hOut, mOut] = hf.split(':').map(Number)

  const inicio = new Date(y, mo - 1, d, hIn ?? 0, mIn ?? 0, 0, 0)
  let fim = new Date(y, mo - 1, d, hOut ?? 0, mOut ?? 0, 0, 0)
  if (fim.getTime() <= inicio.getTime()) {
    fim = new Date(fim.getTime() + 24 * 60 * 60 * 1000)
  }
  return { inicio, fim }
}

/** Verifica sobreposição parcial ou total entre dois intervalos. */
export function intervalosSeSobrepoem(
  inicioA: Date,
  fimA: Date,
  inicioB: Date,
  fimB: Date,
): boolean {
  return inicioA.getTime() < fimB.getTime() && inicioB.getTime() < fimA.getTime()
}

function plantaoAtivoParaCompliance(status: string): boolean {
  return STATUS_PLANTAO_ATIVO_COMPLIANCE.includes(status as StatusPlantaoEscala)
}

async function buscarPlantoesProfissionalJanela(
  userId: string,
  profissionalId: string,
  dataMinIso: string,
  dataMaxIso: string,
): Promise<PlantaoComplianceRow[]> {
  const { data, error } = await supabase
    .from('plantoes')
    .select(
      `
      id,
      user_id,
      local_id,
      setor_id,
      profissional_id,
      data_plantao,
      hora_inicio,
      hora_fim,
      status,
      observacoes,
      locais ( nome_fantasia )
    `,
    )
    .eq('user_id', userId)
    .eq('profissional_id', profissionalId)
    .gte('data_plantao', dataMinIso)
    .lte('data_plantao', dataMaxIso)

  if (error) throw new Error(error.message)
  return (data ?? []) as PlantaoComplianceRow[]
}

function janelaDatasConsulta(inicio: Date, fim: Date): { min: string; max: string } {
  return {
    min: format(subDays(inicio, 1), 'yyyy-MM-dd'),
    max: format(fim, 'yyyy-MM-dd'),
  }
}

/**
 * Varredura de choque de horário em qualquer hospital da rede (tenant).
 * Bloqueia alocação se o profissional já tem plantão ativo no mesmo intervalo.
 */
export async function verificarChoqueHorario(
  userId: string,
  profissionalId: string,
  dataInicio: Date,
  dataFim: Date,
  plantaoIdExcluir?: string | null,
): Promise<ResultadoChoqueHorario> {
  if (!profissionalId.trim()) {
    return { temChoque: false }
  }

  const { min, max } = janelaDatasConsulta(dataInicio, dataFim)
  const linhas = await buscarPlantoesProfissionalJanela(userId, profissionalId, min, max)

  for (const row of linhas) {
    if (plantaoIdExcluir && row.id === plantaoIdExcluir) continue
    if (!plantaoAtivoParaCompliance(row.status)) continue

    const outro = intervaloPlantao(row.data_plantao, row.hora_inicio, row.hora_fim)
    if (!intervalosSeSobrepoem(dataInicio, dataFim, outro.inicio, outro.fim)) continue

    const hospitalNome =
      row.locais?.nome_fantasia?.trim() ?? 'outro hospital da rede'
    return {
      temChoque: true,
      hospitalNome,
      plantaoConflitanteId: row.id,
      mensagem: `Conflito detetado: Este profissional já está escalado no Hospital ${hospitalNome} neste mesmo horário.`,
    }
  }

  return { temChoque: false }
}

/**
 * Soma horas de plantões confirmados/alocados na semana ISO (início na segunda).
 */
export async function calcularCargaHorariaSemanal(
  userId: string,
  profissionalId: string,
  dataPlantaoIso: string,
  plantaoIdExcluir?: string | null,
): Promise<number> {
  if (!profissionalId.trim() || !dataPlantaoIso) return 0

  const ref = new Date(
    Number(dataPlantaoIso.slice(0, 4)),
    Number(dataPlantaoIso.slice(5, 7)) - 1,
    Number(dataPlantaoIso.slice(8, 10)),
    12,
    0,
    0,
    0,
  )
  const ini = startOfWeek(ref, { weekStartsOn: 1 })
  const fim = endOfWeek(ref, { weekStartsOn: 1 })
  const minChave = format(ini, 'yyyy-MM-dd')
  const maxChave = format(fim, 'yyyy-MM-dd')

  const linhas = await buscarPlantoesProfissionalJanela(
    userId,
    profissionalId,
    minChave,
    maxChave,
  )

  let total = 0
  for (const row of linhas) {
    if (plantaoIdExcluir && row.id === plantaoIdExcluir) continue
    if (!plantaoAtivoParaCompliance(row.status)) continue
    total += duracaoHorasPlantao(row.data_plantao, row.hora_inicio, row.hora_fim)
  }

  return Number(total.toFixed(2))
}

export function avaliarAvisoCargaSemanal(
  horasAcumuladas: number,
  horasNovoPlantao: number,
  limite = LIMITE_HORAS_SEMANAL_COMPLIANCE,
): ResultadoAvisoCargaSemanal {
  const horasTotais = Number((horasAcumuladas + horasNovoPlantao).toFixed(2))
  const excedeLimite = horasTotais > limite
  const horasFmt = horasTotais.toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })

  return {
    excedeLimite,
    horasAcumuladas: Number(horasAcumuladas.toFixed(2)),
    horasNovoPlantao: Number(horasNovoPlantao.toFixed(2)),
    horasTotais,
    mensagem: excedeLimite
      ? `Aviso de Compliance: A alocação deste turno fará o profissional exceder o limite recomendado de ${limite} horas semanais (Total: ${horasFmt} horas).`
      : undefined,
  }
}

/** Monta texto de observações com justificativa de coordenação (persistência no Supabase). */
export function observacoesComJustificativaCoordenacao(
  observacoesExistentes: string | null | undefined,
  justificativa: string,
): string {
  const base = (observacoesExistentes ?? '').trim()
  const bloco = `${PREFIXO_JUSTIFICATIVA_COORDENACAO} ${justificativa.trim()}`
  if (!base) return bloco
  if (base.includes(PREFIXO_JUSTIFICATIVA_COORDENACAO)) {
    return base.replace(
      new RegExp(`${PREFIXO_JUSTIFICATIVA_COORDENACAO}[^\n]*`),
      bloco,
    )
  }
  return `${base}\n${bloco}`
}
